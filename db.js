const { Sequelize } = require("sequelize");
require('dotenv').config();

const ENVIRONMENT = process.env.ENVIRONMENT;
const DB_NAME=process.env.DB_NAME
const DB_USER=process.env.DB_USER
const DB_PASSWORD=process.env.DB_PASSWORD

let dbObj;
if(ENVIRONMENT == 'prod') {
  dbObj = new Sequelize('vrmpool', 'admin', 'Password123', {
    dialect: 'mysql',
    host: 'vrmpool.cng2o0ce4jtm.ap-south-1.rds.amazonaws.com',
    port:'3306'
  });
} else {
  dbObj = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    dialect: 'mysql',
    host: 'localhost'
  });

}

module.exports = dbObj