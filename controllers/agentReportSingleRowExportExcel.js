const verifyToken = require("../middleware/verifyToken");
// const AgentData = require("../models/AgentData");
// const User = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col, literal } = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const moment = require('moment-timezone');
const ExcelJS = require('exceljs');

// User.hasMany(AgentData, { foreignKey: 'user_id' });
// AgentData.belongsTo(User, { foreignKey: 'user_id' });

const dbObj=require('../db')
const { AgentData, User } = require('../models');


const getSingleRowExportExcel = [
    verifyToken,
    async (req, res) => {
        try {
            const { user_type, supervisor_id, agent_id, fromtime, totime, page = 1, } = req.body;

            if (!page) {
                page = 1;
            }
            pageSize = process.env.PAGE_LENGTH
            const customPageSize = req.body.pageSize;
            if (customPageSize) {
                pageSize = customPageSize
            }

            // Construct filter for Users
            let userFilter = {
                is_active: 1,
                is_deleted: 0
            };
            if (user_type) {
                userFilter.user_type = user_type;
            }
            if (supervisor_id) {
                userFilter.added_by = supervisor_id;
            }

            if (Array.isArray(agent_id)) {
                if (agent_id.length > 0) {
                    userFilter.mobile = agent_id;
                }
            }
            const users = await User.findAll({
                where: userFilter,
            });

            // Extract user mobiles for filtering reports
            const userMobiles = users.map(user => user.mobile);

            // Construct filter for Reports
            let reportFilter = {
                AgentPhoneNumber: {
                    [Op.in]: userMobiles,
                }
            };
            if (fromtime && totime) {
                reportFilter.updatedAt = {
                    [Op.between]: [fromtime, totime]
                };
            }

            // Pagination parameters
            const offset = (page - 1) * pageSize;
            const limit = parseInt(pageSize);

            // Fetch reports based on filters with pagination
            const { count, rows: reports } = await AgentData.findAndCountAll({
                attributes: [
                    [
                        fn('SUM', col('IncomingCalls')),
                        'IncomingCalls'
                    ],
                    [
                        fn('SUM', col('MissedCalls')),
                        'MissedCalls'
                    ],
                    [
                        fn('SUM', col('NoAnswer')),
                        'NoAnswer'
                    ],
                    [
                        fn('SUM', col('Busy')),
                        'Busy'
                    ],
                    [
                        fn('SUM', col('Failed')),
                        'Failed'
                    ],
                    [
                        fn('SUM', col('OutgoingCalls')),
                        'OutgoingCalls'
                    ],
                    [fn('AVG', col('DeviceOnPercent')),
                        'DeviceOnPercent'
                    ],
                    [
                        fn('SUM', col('TotalCallDurationInMinutes')),
                        'TotalCallDurationInMinutes'
                    ],
                    [
                        fn('SUM', col('DeviceOnHumanReadableInSeconds')),
                        'DeviceOnHumanReadableInSeconds'
                    ],
                    [
                        fn('COUNT', col('DeviceOnHumanReadableInSeconds')),
                        'TotalRowsCount'
                    ],
                    'DeviceOnHumanReadable',
                    'AgentPhoneNumber',
                    'timeRange',
                ],
                where: reportFilter,
                group: ['AgentPhoneNumber'],
                include: [{
                    model: User,
                    attributes: ['mobile', 'id', 'name', 'email', 'user_type', 'is_active'],
                    required: false, // Use left outer join
                    on: {
                        // Define join condition explicitly
                        '$agentdata.AgentPhoneNumber$': { [Op.col]: 'user.mobile' }
                    }
                    
                  }],
                order: [['createdAt', 'DESC']],
            });


            // Generate Excel file
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Agent Reports');



            worksheet.columns = [

                { header: 'RM Name', key: 'name', width: 20 },
                { header: 'RM Email', key: 'email', width: 30 },
                { header: 'RM Mobile Number', key: 'mobile', width: 15 },
                { header: 'Available Time', key: 'avilable_time', width: 15 },
                { header: 'Non Available Time', key: 'non_avilable_time', width: 15 },
                { header: 'On Call Time', key: 'on_call_timer', width: 15 },
                { header: 'Received Calls', key: 'received_call_timer', width: 15 },
                { header: 'Missed Calls', key: 'missed_call_timer', width: 15 },
                { header: 'Outgoing Calls', key: 'outgoing_call_timer', width: 15 },

            ];
            // Add rows
            reports.forEach(report => {
                
                worksheet.addRow({
                    name: report.user.name,
                    email: report.user.email,
                    mobile: report.user.mobile,
                    avilable_time: secondsToDhmsForAvailableTimer(report.DeviceOnHumanReadableInSeconds),
                    non_avilable_time: secondsToDhms((((report.dataValues.TotalRowsCount*60)*60)  - report.DeviceOnHumanReadableInSeconds)),
                    on_call_timer: secondsToDhmsForAvailableTimer(report.TotalCallDurationInMinutes*60),
                    received_call_timer: calculateAbsoluteDifference(report.IncomingCalls, report.MissedCalls),
                    missed_call_timer: report.MissedCalls,
                    outgoing_call_timer: report.OutgoingCalls,
                });
            });
            // Write to buffer
            const buffer = await workbook.xlsx.writeBuffer();
            // Send the buffer as an Excel file
            res.setHeader('Content-Disposition', `attachment; filename="AgentReports_${generateTimestampIST()}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
           // return res.send(buffer);
            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

function generateTimestampIST() {
    const now = new Date();
    
    // Convert to IST by adding 5 hours and 30 minutes
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
function customTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}


function calculateAbsoluteDifference(incomingCalls, missedCalls) {
    return Math.abs(incomingCalls - missedCalls);
}


function secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d : "00";
    var hDisplay = h > 0 ? h : "00";
    var mDisplay = m > 0 ? m : "00";
    var sDisplay = s > 0 ? s : "00";
    return dDisplay + ":" + hDisplay + ":" + mDisplay + ":" + sDisplay;
}

function secondsToDhmsForAvailableTimer(seconds) {

   // var seconds = convertStringToSeconds(stringData);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d : "00";
    var hDisplay = h > 0 ? h : "00";
    var mDisplay = m > 0 ? m : "00";
    var sDisplay = s > 0 ? s : "00";
    return dDisplay + ":" + hDisplay + ":" + mDisplay + ":" + sDisplay;
}

function convertStringToSeconds(timeString) {
    const timeUnits = {
        'days': 0,
        'hours': 0,
        'minutes': 0,
        'seconds': 0
    };

    const regex = /(\d+)\s*(days?|hours?|minutes?|seconds?)/gi;
    let match;
    while ((match = regex.exec(timeString)) !== null) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('day')) {
            timeUnits['days'] = value;
        } else if (unit.startsWith('hour')) {
            timeUnits['hours'] = value;
        } else if (unit.startsWith('minute')) {
            timeUnits['minutes'] = value;
        } else if (unit.startsWith('second')) {
            timeUnits['seconds'] = value;
        }
    }

    const daysToSeconds = timeUnits['days'] * 24 * 60 * 60;
    const hoursToSeconds = timeUnits['hours'] * 60 * 60;
    const minutesToSeconds = timeUnits['minutes'] * 60;
    const seconds = timeUnits['seconds'];

    return daysToSeconds + hoursToSeconds + minutesToSeconds + seconds;
}

module.exports = {
    getSingleRowExportExcel,
};
