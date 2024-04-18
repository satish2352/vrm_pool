const { DataTypes } = require("sequelize");
const dbObj = require('../db');

const UserType = dbObj.define('user_type', {
  type: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  },
  is_active: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  }, 
});

module.exports = {UserType};
