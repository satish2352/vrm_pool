const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { Op, fn, col } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
require('dotenv').config();
const ExcelJS = require('exceljs');

User.hasMany(AgentData, { foreignKey: 'user_id' });
AgentData.belongsTo(User, { foreignKey: 'user_id' });

const BATCH_SIZE = 1000;

const exportExcelTimeSlotWise = [
    verifyToken,
    async (req, res) => {
        try {
            const { fromtime, totime, agent_id, supervisor_id } = req.body;
            let { page = 1 } = req.body;
            const customPageSize = req.body.pageSize;
            const pageSize = customPageSize || parseInt(process.env.PAGE_LENGTH, 10);
            let processedCount = 0;
            const allReports = [];

            const xfromTime = new Date(fromtime);
            let currentTime1HrBack = new Date(xfromTime.getTime() - 60 * 60000); // Subtract 60 minutes from fromTime
            let toTime1Hrback = new Date(currentTime1HrBack.getTime() - 60 * 60000); // Subtract 60 minutes from toTime

            var reportFilter = {
                updatedAt: {
                    [Op.between]: [new Date(fromtime), new Date(totime)]
                }
            };



            if (Array.isArray(agent_id) && agent_id.length > 0 && agent_id.length < 2) {
                reportFilter.user_id = {
                    [Op.in]: agent_id
                };


                const { count, rows } = await AgentData.findAndCountAll({
                    where: reportFilter,
                    order: [['createdAt', 'DESC']],
                    limit: BATCH_SIZE,
                    offset: processedCount,
                });

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
            } else {
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
                            fn('COUNT', col('DeviceOnPercent')),
                            'TotalRowsCount'
                        ],
                        'DeviceOnHumanReadable',
                    ],
                    where: reportFilter,
                    group: ['user_id'],
                    order: [['createdAt', 'DESC']],
                });
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


            }

            console.log(allReports);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Agent Reports');

            // Add columns
            // worksheet.columns = [

            //     { header: 'RM Name', key: 'name', width: 20 },
            //     { header: 'RM Mobile Number', key: 'mobile', width: 15 },
            //     { header: 'RM Email', key: 'email', width: 30 },                
            //     { header: 'Incoming Calls', key: 'IncomingCalls', width: 15 },
            //     { header: 'Missed Calls', key: 'MissedCalls', width: 15 },
            //     { header: 'No Answer', key: 'NoAnswer', width: 10 },
            //     { header: 'Busy', key: 'Busy', width: 10 },
            //     { header: 'Failed', key: 'Failed', width: 10 },
            //     { header: 'Outgoing Calls', key: 'OutgoingCalls', width: 15 },
            //     { header: 'Total Call Duration (Minutes)', key: 'TotalCallDurationInMinutes', width: 25 },
            //     { header: 'Average Handling Time (Minutes)', key: 'AverageHandlingTimeInMinutes', width: 25 },
            //     { header: 'Device On Percent', key: 'DeviceOnPercent', width: 15 },
            //     { header: 'Device On Human Readable (Seconds)', key: 'DeviceOnHumanReadableInSeconds', width: 30 },

            // ];

            // allReports.forEach(report => {
            //     worksheet.addRow({
            //         mobile: report.user.mobile,
            //         name: report.user.name,
            //         email: report.user.email,
            //         user_type: report.user.user_type,
            //         is_active: report.user.is_active,
            //         IncomingCalls: report.IncomingCalls,
            //         MissedCalls: report.MissedCalls,
            //         NoAnswer: report.NoAnswer,
            //         Busy: report.Busy,
            //         Failed: report.Failed,
            //         OutgoingCalls: report.OutgoingCalls,
            //         TotalCallDurationInMinutes: report.TotalCallDurationInMinutes,
            //         AverageHandlingTimeInMinutes: report.AverageHandlingTimeInMinutes,
            //         DeviceOnPercent: report.DeviceOnPercent,
            //         DeviceOnHumanReadableInSeconds: report.DeviceOnHumanReadableInSeconds                    
            //     });


            worksheet.columns = [

                { header: 'Sr No', key: 'sr_no', width: 5 },
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
            allReports.forEach(report => {
                let avilable_time_value = secondsToDhmsForAvailableTimer(report.DeviceOnHumanReadable);
                worksheet.addRow({
                    name: report.user.name,
                    email: report.user.email,
                    mobile: report.user.mobile,
                    avilable_time: avilable_time_value,
                    non_avilable_time: secondsToDhms((((report.TotalRowsCount * 60) * 60) - report.DeviceOnHumanReadableInSeconds)),
                    on_call_timer: report.TotalCallDurationInMinutes,
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
            //return res.send(buffer);
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

function secondsToDhmsForAvailableTimer(stringData) {

    var seconds = convertStringToSeconds(stringData);
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
    exportExcelTimeSlotWise,
};
