const { Sequelize } = require("sequelize");
require('dotenv').config();

const ENVIRONMENT = process.env.ENVIRONMENT;
const DB_NAME=process.env.DB_NAME
const DB_USER=process.env.DB_USER
const DB_PASSWORD=process.env.DB_PASSWORD
const DB_HOST=process.env.DB_HOST
const DB_PORT=process.env.DB_PORT

let dbObj;

  dbObj = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    dialect: 'mysql',
    host: DB_HOST,
    port:DB_PORT,
    timezone: '+05:30', // Set your desired time zone here
  });


module.exports = dbObj