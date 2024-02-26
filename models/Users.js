const { DataTypes } = require("sequelize");
const dbObj = require('../db');
const Report = require("../models/Report");

const User = dbObj.define('user', {
  fname: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: { msg: "First Name is required." }, // Additional validation for not null
      notEmpty: { msg: "First Name cannot be empty." }
      
    }
  },
  mname: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: { msg: "Middle Name is required." }, // Additional validation for not null
      notEmpty: { msg: "Middle Name cannot be empty." }
      
    }
  },
  lname: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: { msg: "Last Name is required." }, // Additional validation for not null
      notEmpty: { msg: "Last Name cannot be empty." }
      
    }
  },
  email: {
    type:DataTypes.STRING,
    unique: true,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: { msg: "Email is required." }, // Additional validation for not null
      notEmpty: { msg: "Email cannot be empty." },
      isEmail:true, // Additional validation for not empty
    }
  },
  mobile: {
    type:DataTypes.STRING,
    allowNull: false, 
    unique: true,// This is the default if required is not explicitly set
    validate: {
      notNull: { msg: "Mobile number is required." }, // Additional validation for not null
      notEmpty: { msg: "Mobile number cannot be empty." },
      len: { 
        args: [10, 10], 
        msg: "Mobile number must be exactly 10 digits long." 
      } // Additional validation for not empty
    }
  },
  password: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: { msg: "password  is required." }, // Additional validation for not null
      notEmpty: { msg: "password  cannot be empty." },
      len: { 
        args: [8, 50], 
        msg: "Password must be between 8 and 50 characters long." 
      } // Additional validation for not empty
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
  },
  added_by: {
    allowNull: true,
    type: DataTypes.STRING,
  }
  
});

module.exports = User;