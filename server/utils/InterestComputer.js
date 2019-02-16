// 利息计算器
// 首先获取一条 money_change_record 作为起始点， 获取 对应的 borrow_loan_record 基本信息。
// 查询对应的还款记录，保存下来。
// 计算从起始点至今的 变动记录，再依次插入数据库。把最后一条 money_change_record 的本金利息同步到 borrow_loan_record。

const { pool } = require('./mysql')
const moment = require('moment')
const { cycle2char } = require('./enums')

class InterestComputer {
  // repaymentRecords 的 date应该是按时间正序排列好的
  constructor(lastRecord, blInfo, repaymentRecords = []) {
    if (lastRecord.blid !== blInfo.id) {
      throw '借贷单下没有该还款单！'
    }

    this.conn = pool.getConnection();
    this.lastRecord = lastRecord;
    this.blInfo = blInfo;
    this.repaymentRecords = repaymentRecords;
    this.payoff = false;  //是否还清

    // 整个计算过程，blinfo是不变的
    this.blid = blInfo.id;
    this.loanDate = blInfo.loanDate;
    this.cycle = blInfo.cycle;
    this.cycleUnit = blInfo.cycleUnit;
    this.momentUnit = cycle2char[blInfo.cycleUnit];
    this.loanAmount = blInfo.loanAmount;
    this.rate = blInfo.rate;
    this.afterCycle = blInfo.afterCycle;
    this.repaymentType = blInfo.repaymentType;

    // 整个计算过程，每次插入money_change_record前，这些都可能变化
    this.status = 'DONE';
    this.changeDate = lastRecord.date;
    this.changeOrder = lastRecord.changeOrder;
    this.event = lastRecord.event;
    this.changeMoney = lastRecord.changeMoney;
    this.principal = lastRecord.principal;
    this.interest = lastRecord.interest;

    this.computePeriod()
  }

  // 计算出一个包含 changeDate的周期。 cycleStartDate <= changeDate < cycleEndDate
  computePeriod() {
    const loanDate = moment(this.loanDate)
    const changeDate = moment(this.changeDate)
    const cycleNumber = changeDate.diff(loanDate, this.momentUnit)

    // 这两个还是moment对象
    this.cycleStartDate = loanDate.add(cycleNumber, this.momentUnit)
    this.cycleEndDate = loanDate.add(cycleNumber + 1, this.momentUnit)
    this.periodDays = this.cycleEndDate.diff(this.cycleStartDate, 'd')
  }

  async deleteBeforeCompute() {
    // 第一条还款记录后面的 状态为 DONE的记录都要重新计算, 未确认的保留让他继续确认
    if (this.repaymentRecords[0]) {
      return await this.conn.execute(
        `DELETE FROM money_change_record WHERE blid=? AND date>? AND status=?`,
        [this.blid, this.repaymentRecords[0].date, 'DONE']
      )
    }
  }

  async compute() {
    await this.deleteBeforeCompute()

    const now = moment(); //now 包含时分秒，同一天 也会为true。
    while (this.cycleEndDate.isBefore(now)) {

      let repaymentRecord = this.repaymentRecords[0]
      while (repaymentRecord && repaymentRecord.date >= this.changeDate && repaymentRecord.date < this.cycleEndDate.format('YYYY-MM-DD')) {
        if (repaymentRecord.date > this.changeDate) {
          await this.settleBeforeRepayment(repaymentRecord.date)
        }
        await this.repay(repaymentRecord)
        this.repaymentRecords.shift();

        // 已经还清了，就可以直接 同步到 borrow_loan_record表中了。
        if (this.payoff) {
          return await this.updateBlInfo()
        }
        repaymentRecord = this.repaymentRecords[0];
      }

      await this.settleToCycleEnd();
      this.computePeriod()
    }

    await this.settleToNow()
    await this.updateBlInfo()
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
    } if (this.repaymentType === 'principalFirst') {
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

    return await this.insertMoneyChange()
  }

  async settleToCycleEnd() {
    this.changeMoney = this.computeInterest(this.cycleEndDate);
    this.changeDate = this.cycleEndDate.format('YYYY-MM-DD')
    if (this.afterCycle === 'compound') {
      this.event = '利息转本金'
      this.principal += this.changeMoney;
    } else {
      this.event = '周期结息';
      this.interest += this.changeMoney;
    }

    return await this.insertMoneyChange()
  }

  async settleToNow() {
    const nowDate = moment().format('YYYY-MM-DD')
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
      [blid, status, this.changeOrder++, changeDate, event, changeMoney, principal, interest]
    )

    return result;
  }

  async updateBlInfo() {
    const { payoff, principal, interest, blid } = this;

    const result = await this.conn.execute(
      `UPDATE borrow_loan_record SET status=?, principal=?, interest=? WHERE id=?`,
      [payoff ? 'FINISHED' : 'CREATED', principal, interest, blid]
    )

    // 如果是FINISHED状态，后续的未确认的还款申请其实应该删除了！暂时不做了

    this.conn.release();
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

  static async create(lastRecord, blInfo, repaymentRecords = []) {
    const ic = new InterestComputer(lastRecord, blInfo, repaymentRecords)
    return await ic.compute()
  }
}

module.exports = {
  IC: InterestComputer
}