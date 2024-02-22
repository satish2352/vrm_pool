const { DataTypes } = require("sequelize");
const dbObj = require('../db');
const Report = require("../models/Report");

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
      notEmpty: true,
      isEmail:true, // Additional validation for not empty
    }
  },
  mobile: {
    type:DataTypes.STRING,
    allowNull: false, 
    unique: true,// This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true,
      len: { min: 10, max: 10 }// Additional validation for not empty
    }
  },
  from_number: {
    type:DataTypes.STRING,
    allowNull: false, 
    unique: true,// This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true,
      len: { min: 10, max: 10 }// Additional validation for not empty
    }
  },
  password: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true,
      len: { min: 8 } // Additional validation for not empty
    }
  },
  user_type: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    unique: true,
    validate: {
      notNull: true, // Additional validation for not null
      notEmpty: true,
      len: { min: 1, max: 3 } // Additional validation for not empty
    }
  },
  fileId: {
    type: DataTypes.STRING,
    defaultValue: null,
  }
  
});

module.exports = User;
