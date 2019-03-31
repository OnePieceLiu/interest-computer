const { User, Project, sequelize } = require('./seq')
const { Op } = require('sequelize')

/* User.findOrCreate({ where: { username: 'maoyuhui' }, defaults: { job: 'salesman' } })
  .then(([user, created]) => {
    console.log(user.get({ plain: true }))
    console.log(created)
  }) */

/* User.findAndCountAll({
  where: {
    username: {
      [Op.like]: 'mao%'
    }
  },
  offset: 0,
  limit: 1
}).then(result => {
  console.log(result.count)
  console.log(result.rows)
}) */

/* User.findAll({ order: ['username', 'job'], raw: true }).then(users => {
  console.log(users)
}) */

/* User.count({ where: { username: { [Op.like]: 'zhoupq%' } } }).then(c => {
  console.log(c + ' users')
}) */

/* User.max('username').then(max => {
  console.log('max username', max)
}) */

User.bulkCreate([
  { username: 'wuliang', job: 'web engineer' },
  { username: 'paoding', job: 'java engineer' },
  { username: 'caoti', job: 'java engineer' },
  { username: 'huisheng', job: 'project manager' },
  { username: 'aikuisi', job: 'product manager' },
  { username: 'lingxian', job: 'product manager' },
]).then((data) => {
  console.log('data', data)
})

/* User.update({ job: 'web engineer' }, { where: { username: 'zhoupq' } })
  .then(([affectedCount, affectedRows]) => {
    console.log('count', affectedCount)
    console.log('rows', affectedRows)
  }) */

/* User.destroy({
  where: {
    job: 'java engineer'
  },
  truncate: true
}).then(affectedCount => {
  console.log('count', affectedCount)
}) */
