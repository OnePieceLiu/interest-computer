// 利息计算器
// 首先获取一条 money_change_record 作为起始点， 获取 对应的 borrow_loan_record 基本信息。
// 查询对应的还款记录，保存下来。
// 计算从起始点至今的 变动记录，再依次插入数据库。把最后一条 money_change_record 的本金利息同步到 borrow_loan_record。

const moment = require('moment')

class InterestComputer {
  // repaymentRecords 的 date应该是按时间正序排列好的
  constructor({ lastRecord, blInfo, repaymentRecords = [], conn }) {
    // console.log('repaymentRecords', repaymentRecords)
    if (Number(lastRecord.blid) !== Number(blInfo.id)) {
      throw new Error('借贷单下没有该还款单！')
    }

    this.repaymentRecords = repaymentRecords.map(e => {
      e.changeMoney = Number(e.changeMoney) //DEC存储的是字符串
      e.date = moment(e.date)
      return e;
    });
    this.conn = conn;
    this.payoff = false;  //是否还清

    // 整个计算过程，blinfo是不变的
    this.blid = blInfo.id;
    this.loanDate = moment(blInfo.loanDate);
    this.cycle = blInfo.cycle;
    this.cycleUnit = blInfo.cycleUnit;
    this.loanAmount = Number(blInfo.loanAmount);    //DEC存储的是字符串
    this.rate = Number(blInfo.rate);
    this.afterCycle = blInfo.afterCycle;
    this.repaymentType = blInfo.repaymentType;

    // 整个计算过程，每次插入money_change_record前，这些都可能变化
    this.status = 'DONE';
    this.changeDate = moment(lastRecord.date);
    this.changeOrder = lastRecord.changeOrder;
    this.event = lastRecord.event;
    this.changeMoney = Number(lastRecord.changeMoney);
    this.principal = Number(lastRecord.principal);
    this.interest = Number(lastRecord.interest);

  }

  // 计算出一个包含 changeDate的周期。 cycleStartDate <= changeDate < cycleEndDate
  computePeriod() {
    const cycleNumber = this.changeDate.diff(this.loanDate, this.cycleUnit) / this.cycle | 0;

    // moment().add方法是修改moment对象，所以需要新创建 moment对象再add
    this.cycleStartDate = moment(this.loanDate).add(cycleNumber * this.cycle, this.cycleUnit)
    this.cycleEndDate = moment(this.cycleStartDate).add(this.cycle, this.cycleUnit)
    this.periodDays = this.cycleEndDate.diff(this.cycleStartDate, 'd')
  }

  async deleteBeforeCompute() {
    // 计算前，changeOrder 大于 lastRecord.changeOrder的都需要清理重新计算
    return await this.conn.execute(
      `DELETE FROM money_change_record WHERE blid=? AND changeOrder>?`,
      [this.blid, this.changeOrder]
    )
  }

  async compute() {
    this.computePeriod()
    await this.deleteBeforeCompute()

    const now = moment(); //now 包含时分秒，同一天 也会为true。

    while (this.cycleEndDate.isBefore(now)) {
      await this.loopRepay(this.cycleEndDate)
      if (this.payoff) return;

      await this.settleToCycleEnd();
      this.computePeriod()
    }

    await this.loopRepay()
    if (this.payoff) return;

    await this.settleToNow()
    await this.updateBlInfo()
  }

  async loopRepay() {
    let repaymentRecord = this.repaymentRecords[0]

    while (repaymentRecord && !repaymentRecord.date.isBefore(this.changeDate) && repaymentRecord.date.isBefore(this.cycleEndDate)) {
      if (repaymentRecord.date.isAfter(this.changeDate)) {
        await this.settleBeforeRepayment(repaymentRecord.date)
      }
      await this.repay(repaymentRecord)
      if (this.payoff) return

      this.repaymentRecords.shift();
      repaymentRecord = this.repaymentRecords[0];
    }
  }

  async settleBeforeRepayment(repayDate) {
    this.event = '还款前结息';
    this.changeMoney = this.computeInterest(repayDate);
    this.changeDate = repayDate;
    this.interest += this.changeMoney;

    return await this.insertMoneyChange()
  }

  async repay(record) {
    this.event = '还钱';
    this.changeMoney = record.changeMoney;  // 此时changeMoney应该为负值
    this.changeDate = record.date;
    const totalMoney = this.principal + this.interest;

    if (totalMoney + this.changeMoney <= 0) {
      this.principal = 0;
      this.interest = 0;
      this.payoff = true;
      // 清理未确认的还款申请！暂时未做
    } else if (this.repaymentType === 'principalFirst') {
      const diff = this.principal + this.changeMoney;
      if (diff > 0) {
        this.principal = diff
      } else {
        this.principal = 0;
        this.interest += diff;
      }
    } else if (this.repaymentType === 'interestFirst') {
      const diff = this.interest + this.changeMoney;
      if (diff > 0) {
        this.interest = diff;
      } else {
        this.interest = 0;
        this.principal += diff;
      }
    } else {
      // equalRatio
      const changeInterest = parseInt(this.changeMoney * this.interest / totalMoney * 100) / 100;
      const changePrincipal = this.changeMoney - changeInterest
      this.principal += changePrincipal;
      this.interest += changeInterest;
    }

    console.log('record.id', record.id)

    await this.insertMoneyChange();
    if (this.payoff) await this.updateBlInfo()
    return
  }

  async settleToCycleEnd() {
    this.changeMoney = this.computeInterest(this.cycleEndDate);
    this.changeDate = this.cycleEndDate
    if (this.afterCycle === 'compound') {
      this.event = '周期结息转本金'
      this.principal += this.changeMoney + this.interest;
      this.interest = 0;
    } else {
      this.event = '周期结息';
      this.interest += this.changeMoney;
    }

    return await this.insertMoneyChange()
  }

  async settleToNow() {
    const nowDate = moment().startOf('day')
    if (nowDate.isSame(this.changeDate, 'day')) return;

    this.event = '按天生息'
    this.changeMoney = this.computeInterest(nowDate)
    this.changeDate = nowDate
    this.interest += this.changeMoney

    return await this.insertMoneyChange()
  }

  async insertMoneyChange() {
    const { blid, status, changeDate, event, changeMoney, principal, interest } = this;

    const result = await this.conn.execute(
      `INSERT INTO money_change_record (blid, status, changeOrder, date, event, changeMoney, principal, interest) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
      [blid, status, ++this.changeOrder, changeDate.format('YYYY-MM-DD'), event, changeMoney, principal, interest]
    )

    return result;
  }

  async updateBlInfo() {
    const { payoff, principal, interest, blid } = this;

    const result = await this.conn.execute(
      `UPDATE borrow_loan_record SET status=?, principal=?, interest=? WHERE id=?`,
      [payoff ? 'FINISHED' : 'CREATED', principal, interest, blid]
    )

    return result;
  }

  computeInterest(endDate) {
    const { principal, rate, changeDate, periodDays } = this;
    const interestStartDate = moment(changeDate)
    const interestEndDate = moment(endDate)
    const interestDays = interestEndDate.diff(interestStartDate, 'd')
    const cycleInterest = principal * rate / 100;

    return cycleInterest * interestDays / periodDays;
  }

  static async create({ lastRecord, blInfo, repaymentRecords = [], conn }) {
    const ic = new InterestComputer({ lastRecord, blInfo, repaymentRecords, conn })
    return await ic.compute()
  }
}

module.exports = {
  IC: InterestComputer
}