const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { Op, fn, col } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
require('dotenv').config();

User.hasMany(AgentData, { foreignKey: 'user_id' });
AgentData.belongsTo(User, { foreignKey: 'user_id' });

const BATCH_SIZE = 1000;

const getAgentReportsSingleRow = [
    verifyToken,
    async (req, res) => {
        try {
            const { fromtime, totime, agent_id,supervisor_id } = req.body;
            let { page = 1 } = req.body;
            const customPageSize = req.body.pageSize;
            const pageSize = customPageSize || parseInt(process.env.PAGE_LENGTH, 10);

            const offset = (page - 1) * pageSize;
            const limit = pageSize;

            let processedCount = 0;
            const allReports = [];

            //const xfromTime = new Date(fromtime);
            //let currentTime1HrBack = new Date(xfromTime.getTime() - 60 * 60000); // Subtract 60 minutes from fromTime
            //let toTime1Hrback = new Date(currentTime1HrBack.getTime() - 60 * 60000); // Subtract 60 minutes from toTime

            var reportFilter = {
                updatedAt: {
                    [Op.between]: [new Date(fromtime), new Date(totime)]
                }
            };
            if (Array.isArray(agent_id) && agent_id.length > 0 && agent_id.length<2) {
                reportFilter.user_id = {
                    [Op.in]: agent_id
                };

                console.log("----------------------------------------------")

                while (true) {
                    const { count, rows } = await AgentData.findAndCountAll({
                        where: reportFilter,
                        order: [['createdAt', 'DESC']],
                        limit: BATCH_SIZE,
                        offset: processedCount,
                    });
                
                    if (rows.length === 0) break;
                    const userIds = rows.map(report => report.user_id);
                    const userWhereClause = {
                        id: userIds,
                        is_active: 1,
                        is_deleted: 0
                    };

                    if (supervisor_id) {
                        userWhereClause.added_by = supervisor_id;
                    }

                    const agents = await User.findAll({
                        where: userWhereClause,
                        attributes: ['id', 'mobile', 'name', 'email', 'user_type', 'is_active'],
                    });
                
                    const agentDetailsMap = agents.reduce((acc, agent) => {
                        acc[agent.id] = agent;
                        return acc;
                    }, {});

                    const combinedReports = rows.map(report => {
                        const agent = agentDetailsMap[report.user_id];
                        return {
                            ...report.get(),
                            user: agent ? agent.get() : null,
                            TotalRowsCount: count  // Include the total count here

                        };
                    }).filter(report => report.user !== null);

                    allReports.push(...combinedReports);

                    processedCount += BATCH_SIZE;
                }
            } else {

                while (true) {
                    if (Array.isArray(agent_id) && agent_id.length > 0 && agent_id.length>1) {
                        reportFilter.user_id = {
                            [Op.in]: agent_id
                        };
                    }
                   
                    const agentDataBatch = await AgentData.findAll({
                        attributes: [
                            'user_id',
                            [fn('SUM', col('IncomingCalls')), 'IncomingCalls'],
                            [fn('SUM', col('MissedCalls')), 'MissedCalls'],
                            [fn('SUM', col('NoAnswer')), 'NoAnswer'],
                            [fn('SUM', col('Busy')), 'Busy'],
                            [fn('SUM', col('Failed')), 'Failed'],
                            [fn('SUM', col('OutgoingCalls')), 'OutgoingCalls'],
                            [fn('SUM', col('TotalCallDurationInMinutes')), 'TotalCallDurationInMinutes'],
                            [fn('AVG', col('AverageHandlingTimeInMinutes')), 'AverageHandlingTimeInMinutes'],
                            [fn('AVG', col('DeviceOnPercent')), 'DeviceOnPercent'],
                            [
                                fn('SUM', col('DeviceOnHumanReadableInSeconds')),
                                'DeviceOnHumanReadableInSeconds'
                            ],
                            [
                                fn('COUNT', col('DeviceOnHumanReadableInSeconds')),
                                'TotalRowsCount'
                            ],
                            'DeviceOnHumanReadable',
                        ],
                        where: reportFilter,
                        group: ['user_id'],
                        order: [['createdAt', 'DESC']],
                        limit: BATCH_SIZE,
                        offset: processedCount,
                    });

                    if (agentDataBatch.length === 0) break;

                    const userIds = agentDataBatch.map(report => report.user_id);

                    const userWhereClause = {
                        id: userIds,
                        is_active: 1,
                        is_deleted: 0
                    };

                    if (supervisor_id) {
                        userWhereClause.added_by = supervisor_id;
                    }
                    


                    const agents = await User.findAll({
                        where: userWhereClause,
                        attributes: ['id', 'mobile', 'name', 'email', 'user_type', 'is_active'],
                    });

                    const agentDetailsMap = agents.reduce((acc, agent) => {
                        acc[agent.id] = agent;
                        return acc;
                    }, {});

                    const combinedReports = agentDataBatch.map(report => {
                        const agent = agentDetailsMap[report.user_id];
                        return {
                            ...report.get(),
                            user: agent ? agent.get() : null
                        };
                    }).filter(report => report.user !== null);
                    allReports.push(...combinedReports);
                    processedCount += BATCH_SIZE;
                }

            
            }

            const totalItems = allReports.length;
            const totalPages = Math.ceil(totalItems / pageSize);
            const paginatedReports = allReports.slice(offset, offset + limit);

            let dataFinal =[];
            paginatedReports.forEach(report => {
                var obj = {};
                obj["avilable_time"] = secondsToDhmsForAvailableTimer(report.DeviceOnHumanReadableInSeconds);
                obj["non_avilable_time"] =secondsToDhms((((report.TotalRowsCount*60)*60)  - report.DeviceOnHumanReadableInSeconds ));
                obj["on_call_timer"] =secondsToDhmsForAvailableTimer(report.TotalCallDurationInMinutes*60);
                obj["received_call_timer"] =calculateAbsoluteDifference(report.IncomingCalls, report.MissedCalls);
                obj["missed_call_timer"] = report.MissedCalls;
                obj["outgoing_call_timer"] = report.OutgoingCalls;
                obj["user"] = report.user;
        
                dataFinal.push(obj);
            });

            const resData = {
                result: true,
                data: dataFinal,
                totalItems: totalItems,
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
