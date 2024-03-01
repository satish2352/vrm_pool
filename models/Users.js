const { DataTypes } = require("sequelize");
const dbObj = require('../db');
const Report = require("../models/Report");

const User = dbObj.define('user', {
  id:{
  type:DataTypes.INTEGER,
  primaryKey:true
  },
  name: {
    type:DataTypes.STRING,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      hasAtLeastSpaceAndCharacters(value) {
        if (!/\s/.test(value) || value.length < 5) {
          throw new Error('Please Enter Full Name');
        }
      }
    }
  },
  email: {
    type:DataTypes.STRING,
    unique: true,
    allowNull: false, // This is the default if required is not explicitly set
    validate: {
      notNull: { msg: "Email is required." }, // Additional validation for not null
      notEmpty: { msg: "Email cannot be empty." },
      isEmail:{ msg: "Please Enter Valid Emaild Address" }, // Additional validation for not empty
    }
  },
  mobile: {
    type:DataTypes.STRING,
    allowNull: false, 
    unique: true,// This is the default if required is not explicitly set
    validate: {
      isValidMobile(value) {
          if (!/^(?:\+91|0|91)?[6-9]\d{9}$/.test(value)) {
              throw new Error('Please enter a valid Indian mobile number');
          }
      }
    }
  },
  password: {
    type:DataTypes.STRING,
    allowNull: true, // This is the default if required is not explicitly set
    validate: {
    // Additional validation for not null
      notEmpty: { msg: "password  cannot be empty." },
      len: { 
        args: [8, 500], 
        msg: "Password must be between 8 and 50  characters long." 
      } // Additional validation for not empty
    }
  },
  textpassword: {
    type:DataTypes.STRING,
    allowNull: true, // This is the default if required is not explicitly set
    validate: {
    // Additional validation for not null
      notEmpty: { msg: "password  cannot be empty." },
      len: { 
        args: [8, 500], 
        msg: "Password must be between 8 and 50 characters long." 
      } // Additional validation for not empty
    }
  },
  user_type: {
    type:DataTypes.STRING,
    allowNull: true, // This is the default if required is not explicitly set
    unique: true,
    validate: {
       // Additional validation for not null
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
  },
  is_active: {
    allowNull: true,
    type: DataTypes.STRING,
  },
  is_deletedis_deleted: {
    allowNull: true,
    type: DataTypes.STRING,
  },

  
});

module.exports = User;