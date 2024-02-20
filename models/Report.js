// Import Sequelize and the connection instance
const { DataTypes, Model } = require('sequelize');
const dbObj = require('../db');

// Define the Report schema
const Report = dbObj.define('reports', {
    xid: {
        type: DataTypes.INTEGER,
        field: 'id'
    },
    direction: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'direction'
    },
    exotel_number: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'exotel_number'
    },
    from_number: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'from_number'
    },
    from_name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'from_name'
    },
    to_number: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'to_number'
    },
    to_name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'to_name'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'status'
    },
    start_time: {
        type: DataTypes.STRING, // Changed to STRING
        allowNull: false,
        field: 'start_time'
    },
    end_time: {
        type: DataTypes.STRING, // Changed to STRING
        allowNull: false,
        field: 'end_time'
    },
    duration: {
        type: DataTypes.STRING, // Changed to STRING
        allowNull: false,
        field: 'duration'
    },
    price: {
        type: DataTypes.STRING, // Changed to STRING
        allowNull: false,
        field: 'price'
    },
    recording_url: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'recording_url'
    },
    price_details: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'price_details'
    },
    group_name: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'group_name'
    },
    from_circle: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'from_circle'
    },
    to_circle: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'to_circle'
    },
    leg1_status: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'leg1_status'
    },
    leg2_status: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'leg2_status'
    },
    conversation_duration: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'conversation_duration'
    },
    app_id: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'app_id'
    },
    app_name: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'app_name'
    },
    digits: {
        type: DataTypes.STRING,
        allowNull: true,
        field:'digits'
    },
    disconnected_by: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'disconnected_by'
    }
}, {
    modelName: 'Report',
    tableName: 'reports', // Adjust table name if needed
    timestamps: true // Disable timestamps fields (createdAt, updatedAt)
});

// Export the Report model
module.exports = Report;
