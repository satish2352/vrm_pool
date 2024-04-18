const { DataTypes } = require("sequelize");
// const dbObj = require('../db');

const OTP = dbObj.define('otp', {
    otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      expiry_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      mobile: {
        type: DataTypes.STRING,                                                                          
        allowNull: false,
      },
      send_count: {
        type: DataTypes.INTEGER,                                                                          
        allowNull: false,
      },
});
OTP.sync();
module.exports = OTP;
