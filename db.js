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
    port:DB_PORT
  });


module.exports = dbObj


// Satish code 
// const { Sequelize } = require("sequelize");
// require('dotenv').config();

// const ENVIRONMENT = process.env.ENVIRONMENT;
// const DB_NAME=process.env.DB_NAME
// const DB_USER=process.env.DB_USER
// const DB_PASSWORD=process.env.DB_PASSWORD
// const DB_HOST=process.env.DB_HOST
// const DB_PORT=process.env.DB_PORT

// let dbObj;

// // Initialize Sequelize instance
// dbObj = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
//   dialect: 'mysql',
//   host: DB_HOST,
//   port: DB_PORT
// });

// // Export dbObj after it has been properly initialized
// dbObj.authenticate()
//   .then(() => {
//     module.exports = dbObj;
//   })
//   .catch(err => {
//     console.error('Unable to connect to the database:', err);
//   });
