CREATE DATABASE interest_computer;

USE interest_computer;

CREATE TABLE wx_user (
openid CHAR(64) PRIMARY KEY,
sessionKey CHAR(64),
nickName CHAR(32),
avatarUrl CHAR(255),
gender TINYINT,
country CHAR(16),
province CHAR(32),
city CHAR(32),
firstTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
lastTime TIMESTAMP ON UPDATE CURRENT_TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
KEY(openid)
);

// 测试过，int modify为bigint, 数据完全兼容。
// status [WAIT_CONFIRM, CREATED, CLOSED, FINISHED]
CREATE TABLE borrow_loan_record (
id INT PRIMARY KEY AUTO_INCREMENT,
loanDate DATE,
cycle TINYINT,
cycleUnit CHAR(1),
loanAmount DEC(14, 2),
rate DEC(6, 2),
principal DEC(14,2),
interest DEC(14,2),
afterCycle CHAR(16),
repaymentType CHAR(16),
loaner CHAR(64),
debtor CHAR(64),
sponsor CHAR(8),
status CHAR(16),
createTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
KEY(id)
);


// events [借钱、还钱、周期结息转本金、周期结息、按天生息、还款前结息]
// status [WAIT_CONFIRM, DONE, CLOSED]
CREATE TABLE money_change_record (
id INT AUTO_INCREMENT,
blid INT,
status CHAR(16),
changeOrder SMALLINT,
date DATE,
event CHAR(8),
changeMoney DEC(14,2),
principal DEC(14,2),
interest DEC(14,2),
createTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY(id),
KEY(id),
KEY(blid)
);

ALTER TABLE borrow_loan_record ADD yearRate DEC(6, 2) after rate;

CREATE TABLE static_assets (
id INT PRIMARY KEY AUTO_INCREMENT,
code CHAR(64),
url CHAR(255)
);

