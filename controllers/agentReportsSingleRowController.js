const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col, literal } = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const moment = require('moment-timezone');

User.hasMany(AgentData, { foreignKey: 'user_id' });
AgentData.belongsTo(User, { foreignKey: 'user_id' });

const getAgentReportsSingleRow = [
    verifyToken,
    async (req, res) => {
        try {
            const { user_type, supervisor_id, agent_id, fromtime, totime, page = 1,} = req.body;

            if(!page)
                {
                    page=1;
                }
            pageSize =process.env.PAGE_LENGTH
            const  customPageSize = req.body.pageSize;
            if(customPageSize)
              {
                pageSize =customPageSize
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
                    userFilter.id = agent_id;
                }
            }
            // Fetch user data based on filters
            const users = await User.findAll({
                where: userFilter,
            });

            // Extract user IDs for filtering reports
            const userIds = users.map(user => user.id);

            // Construct filter for Reports
            let reportFilter = {
                user_id: userIds,
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
                    [fn('COUNT', col('DeviceOnHumanReadableInSeconds')), 'TotalRowsCount'],
                    'DeviceOnHumanReadable',
                ],
                where: reportFilter,
                include: [{
                    model: User,
                    attributes: ['mobile', 'id', 'name', 'email', 'user_type', 'is_active'],
                }],
                group: ['user_id'],
                order: [['createdAt', 'DESC']],
                limit,
                offset,
            });

            // Calculate total pages
            const totalPages = Math.ceil(count.length / pageSize);

            console.log("====================================");
            console.log(reports);
            console.log("====================================");
            let dataFinal =[];
            reports.forEach(report => {
                var obj = {};
                obj["TotalRowsCount"] = report.TotalRowsCount;
                obj["avilable_time"] = secondsToDhmsForAvailableTimer(report.DeviceOnHumanReadableInSeconds);
                obj["non_avilable_time"] =secondsToDhms((((report.TotalRowsCount*60)*60)  - report.DeviceOnHumanReadableInSeconds ));
                obj["on_call_timer"] =secondsToDhmsForAvailableTimer(report.TotalCallDurationInMinutes*60);
                obj["received_call_timer"] =calculateAbsoluteDifference(report.IncomingCalls, report.MissedCalls);
                obj["missed_call_timer"] = report.MissedCalls;
                obj["outgoing_call_timer"] = report.OutgoingCalls;
                obj["user"] = report.user;
                
                dataFinal.push(obj);
            });

            var resData = {
                result: true,               
                // data: reports,
                data: dataFinal,
                totalItems: count.length,
                totalPages: totalPages,
                currentPage: page,
                pageSize: pageSize,
            };
            return res.status(200).json(resData);

            //apiResponse.successResponseWithData(res, 'All details get successfully', response);
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

    //var seconds = convertStringToSeconds(stringData);
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
    getAgentReportsSingleRow,
};
