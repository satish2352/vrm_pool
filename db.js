const { Sequelize } = require("sequelize");

const dbObj = new Sequelize('vrm_pool', 'root', '', {
  dialect: 'mysql',
  host: 'localhost'
});


console.log(dbObj.getDatabaseName());
module.exports = dbObj