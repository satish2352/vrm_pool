const { DataTypes } = require("sequelize");
const dbObj = require('../db');

const User = dbObj.define('user', {
  fname: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  },
  mname: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  },
  lname: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  },
  email: {
    type:DataTypes.STRING,
    unique: true,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  },
  mobile: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  },
  password: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  },
  user_type: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    unique: true,
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true // Additional validation for not empty
    }
  }
  
});

module.exports = User;
