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
                    [
                        fn('SUM', col('TotalCallDurationInMinutes')),
                        'TotalCallDurationInMinutes'
                    ],
                    [
                        fn('AVG', col('AverageHandlingTimeInMinutes')),
                        'AverageHandlingTimeInMinutes'
                    ],
                    [
                        fn('AVG', col('DeviceOnPercent')),
                        'DeviceOnPercent'
                    ],
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

            // Response with pagination metadata
            // const response = {
            //     totalItems: count.length,
            //     totalPages: totalPages,
            //     currentPage: page,
            //     pageSize: pageSize,
            //     reports: reports
            // };

            var resData = {
                result: true,               
                data: reports,
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

module.exports = {
    getAgentReportsSingleRow,
};
