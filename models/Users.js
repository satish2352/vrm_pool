const { DataTypes } = require("sequelize");
const dbObj = require('../db');

const User = dbObj.define('user', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
});

module.exports = User;
