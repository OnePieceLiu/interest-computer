const Sequelize = require('sequelize')
const config = require('../../server/config')

const sequelize = new Sequelize({
  database: 'learn_seq',
  username: config.mysqlUser,
  password: config.mysqlPwd,
  dialect: 'mysql',
  pool: {
    idle: 1000
  }
})

const User = sequelize.define('user', {
  username: Sequelize.STRING,
  job: Sequelize.STRING
})

const Project = sequelize.define('project', {
  title: Sequelize.STRING,
  description: Sequelize.TEXT
});

const Task = sequelize.define('task', {
  title: Sequelize.STRING,
  description: Sequelize.TEXT,
  deadline: Sequelize.DATE
});

//sequelize.sync()

module.exports = {
  sequelize,
  User,
  Project,
  Task
}