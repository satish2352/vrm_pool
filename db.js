const { Sequelize } = require("sequelize");

const dbObj = new Sequelize('vrmpool', 'admin', 'Password123', {
  dialect: 'mysql',
  host: 'vrmpool.cng2o0ce4jtm.ap-south-1.rds.amazonaws.com'
});

// const dbObj = new Sequelize('vrm_pool', 'root', '', {
//   dialect: 'mysql',
//   host: 'localhost'
// });



console.log(dbObj.getDatabaseName());
module.exports = dbObj