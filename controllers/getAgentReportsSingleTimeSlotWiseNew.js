const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { validationResult } = require("express-validator");
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
            const { fromtime, totime } = req.body;
            let { page = 1 } = req.body;
            const customPageSize = req.body.pageSize;
            const pageSize = customPageSize || parseInt(process.env.PAGE_LENGTH, 10);

            const offset = (page - 1) * pageSize;
            const limit = pageSize;

            let processedCount = 0;
            const allReports = [];

            while (true) {
                const reportFilter = {
                    updatedAt: {
                        [Op.between]: [new Date(fromtime), new Date(totime)]
                    }
                };

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

                const agents = await User.findAll({
                    where: {
                        id: userIds,
                        is_active: 1,
                        is_deleted: 0
                    },
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
                });

                allReports.push(...combinedReports);

                processedCount += BATCH_SIZE;
            }

            const totalItems = allReports.length;
            const totalPages = Math.ceil(totalItems / pageSize);
            const paginatedReports = allReports.slice(offset, offset + limit);

            const resData = {
                result: true,
                data: paginatedReports,
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

async function splitTimeIntoSlots(fromTime, toTime) {
    const records = [];
    let currentTime = new Date(fromTime.getTime() - 60 * 60000); // Subtract 60 minutes from fromTime
    toTime = new Date(toTime.getTime() - 60 * 60000); // Subtract 60 minutes from toTime

    while (currentTime <= toTime) {
        const slotStartTime = new Date(currentTime);
        const slotEndTime = new Date(currentTime.getTime() + 60 * 60000); // Add 60 minutes

        records.push({ start_time: slotStartTime, end_time: slotEndTime });

        // Move to the next 60-minute slot
        currentTime = slotEndTime;
    }

    return records;
}

module.exports = {
    getAgentReportsSingleRow,
};
