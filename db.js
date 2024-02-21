const { Sequelize } = require("sequelize");
require('dotenv').config();

const ENVIRONMENT = process.env.ENVIRONMENT;
console.log("process.env.ENVIRONMENT");
console.log(process.env.ENVIRONMENT);
let dbObj;
if(ENVIRONMENT == 'prod') {
  dbObj = new Sequelize('vrmpool', 'admin', 'Password123', {
    dialect: 'mysql',
    host: 'vrmpool.cng2o0ce4jtm.ap-south-1.rds.amazonaws.com',
    port:'3306'
  });
} else {
  dbObj = new Sequelize('vrm_pool', 'root', '', {
    dialect: 'mysql',
    host: 'localhost'
  });

}




console.log(dbObj.getDatabaseName());
module.exports = dbObj