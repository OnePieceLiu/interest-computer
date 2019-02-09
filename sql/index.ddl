CREATE DATABASE interest_computer;

USE interest_computer;

CREATE TABLE wx_user (
openid CHAR(64) PRIMARY KEY,
sessionKey CHAR(64),
nickName CHAR(32),
avatarUrl CHAR(255),
gender TINYINT,
province CHAR(8),
city CHAR(8),
firstTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
lastTime TIMESTAMP ON UPDATE CURRENT_TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// 测试过，int modify为bigint, 数据完全兼容。
CREATE TABLE borrow_loan_record (
id INT PRIMARY KEY AUTO_INCREMENT,
loanDate DATE,
cycle TINYINT,
cycleUnit TINYINT,
loanAmount DEC(14, 2),
rate DEC(6, 2),
afterCycle CHAR(16),
repaymentType CHAR(16),
loaner CHAR(64),
debtor CHAR(64),
sponsor CHAR(8),
status CHAR(16)
);