const { DataTypes } = require("sequelize");
// const dbObj = require('../db');

const UsersCopy = dbObj.define('users_copy', {
  name: {
    type:DataTypes.STRING,
  },
  email: {
    type:DataTypes.STRING,
  },
  mobile: {
    type:DataTypes.STRING,
  },
  password: {
    type:DataTypes.STRING,
  },
  textpassword: {
    type:DataTypes.STRING,
  },
  user_type: {
    type:DataTypes.STRING,
  },
  is_inserted: {
    type:DataTypes.STRING,
  },
  reason: {
    type:DataTypes.STRING,
  },
  fileId: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  added_by: {
    type: DataTypes.STRING,
    defaultValue: null,
  }
  
});

module.exports = UsersCopy;
