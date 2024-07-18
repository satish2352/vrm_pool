const { DataTypes, Model } = require('sequelize');
const { Sequelize } = require("sequelize");

const dbObj = require('../db');


const AgentData = dbObj.define('agentdata', {
  AgentName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  AgentEmail: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  GroupName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  IncomingCalls: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  MissedCalls: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  NoAnswer: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Busy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Failed: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  OutgoingCalls: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  TotalCallDurationInMinutes: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  AverageHandlingTimeInMinutes: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  DeviceOnPercent: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  DeviceOnHumanReadable: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  AgentPhoneNumber: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  DeviceOnHumanReadableInSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  timeRange: {
    type: DataTypes.STRING(255),
    allowNull: true,
    default:''
  },
}, {
  // Other options here
});

// Synchronize the model with the databas

module.exports = AgentData;