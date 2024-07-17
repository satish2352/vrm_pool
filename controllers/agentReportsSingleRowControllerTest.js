const verifyToken = require("../middleware/verifyToken");
const { AgentData, User } = require('../models');
const { validationResult } = require("express-validator");
const { Op, fn, col, literal } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const moment = require('moment-timezone');

const getAgentReportsSingleRow = [
    verifyToken,
    async (req, res) => {
        try {
            const { user_type, supervisor_id, agent_id, fromtime, totime, page = 1 } = req.body;

            let pageSize = parseInt(process.env.PAGE_LENGTH);
            const customPageSize = req.body.pageSize;
            if (customPageSize) {
                pageSize = parseInt(customPageSize);
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
            if (Array.isArray(agent_id) && agent_id.length > 0) {
                userFilter.id = agent_id;
            }

            // Fetch user data based on filters
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
                    [fn('SUM', col('IncomingCalls')), 'IncomingCalls'],
                    [fn('SUM', col('MissedCalls')), 'MissedCalls'],
                    [fn('SUM', col('NoAnswer')), 'NoAnswer'],
                    [fn('SUM', col('Busy')), 'Busy'],
                    [fn('SUM', col('Failed')), 'Failed'],
                    [fn('SUM', col('OutgoingCalls')), 'OutgoingCalls'],
                    [fn('AVG', col('DeviceOnPercent')), 'DeviceOnPercent'],
                    [fn('SUM', col('TotalCallDurationInMinutes')), 'TotalCallDurationInMinutes'],
                    [fn('SUM', col('DeviceOnHumanReadableInSeconds')), 'DeviceOnHumanReadableInSeconds'],
                    [fn('COUNT', col('DeviceOnHumanReadableInSeconds')), 'TotalRowsCount'],
                    'DeviceOnHumanReadable',
                    'AgentPhoneNumber',
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
                limit,
                offset,
            });

            
            // Calculate total pages
            const totalPages = Math.ceil(count.length / pageSize);

            // Process report data
            let dataFinal = [];
            reports.forEach(report => {
                const obj = {
                    "avilable_time": secondsToDhmsForAvailableTimer(report.DeviceOnHumanReadableInSeconds),
                    "non_avilable_time": secondsToDhms(((report.dataValues.TotalRowsCount * 60 * 60) - report.DeviceOnHumanReadableInSeconds)),
                    "on_call_timer": secondsToDhmsForAvailableTimer(report.TotalCallDurationInMinutes * 60),
                    "received_call_timer": calculateAbsoluteDifference(report.IncomingCalls, report.MissedCalls),
                    "missed_call_timer": report.MissedCalls,
                    "outgoing_call_timer": report.OutgoingCalls,
                    "AgentPhoneNumber": report.AgentPhoneNumber,
                    "user": report.user
                };
                dataFinal.push(obj);
            });

            const resData = {
                result: true,
                data: dataFinal,
                totalItems: count.length,
                totalPages: totalPages,
                currentPage: page,
                pageSize: pageSize,
            };
            return res.status(200).json(resData);

        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

// Common Code
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

module.exports = {
    getAgentReportsSingleRow,
};
