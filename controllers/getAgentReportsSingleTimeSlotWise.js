const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
require('dotenv').config();

User.hasMany(AgentData, { foreignKey: 'user_id' });
AgentData.belongsTo(User, { foreignKey: 'user_id' });

const getAgentReportsSingleRow = [
    verifyToken,
    async (req, res) => {
        try {
            const { user_type, supervisor_id, agent_id, fromtime, totime } = req.body;
            let { page = 1 } = req.body;
            const customPageSize = req.body.pageSize;
            const pageSize = customPageSize || parseInt(process.env.PAGE_LENGTH, 10);
            
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
                if (agent_id.length === 0) {
                    return apiResponse.successResponse(res, 'Empty agent list');
                } else {
                    userFilter.id = agent_id;
                }
            }

            const all_agents = await User.findAll({
                where: userFilter
            });

            const total_agents = all_agents.length;
            const offset = (page - 1) * pageSize;
            const limit = pageSize;

            const BATCH_SIZE = 1000;
            let processedCount = 0;
            const allReports = [];
            while (processedCount < total_agents) {
                const agentsBatch = all_agents.slice(processedCount, processedCount + BATCH_SIZE);

                for (const agent of agentsBatch) {
                    const userId = agent.id;
                    var fromTimeDate = new Date(fromtime);
                    fromTimeDate=new Date(fromTimeDate.getTime() - 60 * 60000)
                    const slots = await splitTimeIntoSlots(fromTimeDate, fromTimeDate);
                    const reportsBatch = [];

                    for (const slot of slots) {
                        const reportFilter = {
                            user_id: userId,
                            updatedAt: {
                                [Op.between]: [slot.start_time, slot.end_time]
                            }
                        };

                        const reports = await AgentData.findAll({
                            attributes: [
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
                            include: [{
                                model: User,
                                attributes: ['mobile', 'id', 'name', 'email', 'user_type', 'is_active'],
                            }],
                            group: ['user_id'],
                            order: [['createdAt', 'DESC']],
                        });

                        if (reports.length > 0) {
                            reports[0].DeviceOnPercent = slot;
                            reportsBatch.push(reports[0]);
                        }
                    }

                    if (reportsBatch.length > 0) {
                        allReports.push(...reportsBatch);
                    }
                }

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
