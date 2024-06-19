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

            

            const xfromTime = new Date(fromtime);
            let currentTime1HrBack = new Date(xfromTime.getTime() - 60 * 60000); // Subtract 60 minutes from fromTime
            let toTime1Hrback = new Date(currentTime1HrBack.getTime() - 60 * 60000); // Subtract 60 minutes from toTime

            var reportFilter = {
                updatedAt: {
                    [Op.between]: [new Date(fromtime), new Date(totime)]
                }
            };

            // if (supervisor_id) {
            //     reportFilter.added_by = supervisor_id;
            // }

            if (Array.isArray(agent_id) && agent_id.length > 0 && agent_id.length<2) {
                reportFilter.user_id = {
                    [Op.in]: agent_id
                };

                console.log('Report Filter:', reportFilter); // Debugging line
                while (true) {
                    const { count, rows } = await AgentData.findAndCountAll({
                        where: reportFilter,
                        order: [['createdAt', 'DESC']],
                        limit: BATCH_SIZE,
                        offset: processedCount,
                    });
                
                    if (rows.length === 0) break;
                    const userIds = rows.map(report => report.user_id);
                    //console.log(userIds);
                    const userWhereClause = {
                        id: userIds,
                        is_active: 1,
                        is_deleted: 0
                    };

                    if (supervisor_id) {
                        userWhereClause.supervisor_id = supervisor_id;
                    }

                    const agents = await User.findAll({
                        where: userWhereClause,
                        attributes: ['id', 'mobile', 'name', 'email', 'user_type', 'is_active'],
                    });
                    console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$");
                    console.log(supervisor_id)
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
                console.log('Report Filter:', reportFilter); // Debugging line

                while (true) {
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
                    }).filter(report => report.user !== null);
                    allReports.push(...combinedReports);
                    processedCount += BATCH_SIZE;
                }
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

module.exports = {
    getAgentReportsSingleRow,
};
