const { DataTypes } = require("sequelize");
const dbObj = require('../db');

const Token = dbObj.define('token', {
    tokenId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      token: {
        type: DataTypes.TEXT, // Adjust the data type according to your needs
        allowNull: false
      },
      expiration: {
        type: DataTypes.DATE,
        allowNull: false
      }
});

module.exports = Token;
