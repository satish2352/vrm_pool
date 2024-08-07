const verifyToken = require("../middleware/verifyToken");
const { Op, fn, col, literal } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const { body } = require("express-validator");
const { AgentData, User } = require('../models');

// Define associations
AgentData.belongsTo(User, { foreignKey: 'AgentPhoneNumber', targetKey: 'mobile' });
User.hasMany(AgentData, { foreignKey: 'AgentPhoneNumber', sourceKey: 'mobile' });

const getStats = [
    body(),
    verifyToken,
    async (req, res) => {
        try {
            const { id } = req.body;
            let userFilter = {
                is_deleted: '0',
                is_active: '1',
                user_type: 3
            };

            let reportFilter = {};

            if (id) {
                userFilter = {
                    ...userFilter,
                    added_by: id
                };

                const usersUnderSuperviser = await User.findAll({
                    where: userFilter,
                });

                // Ensure userIds contains correct identifiers
                const userIds = usersUnderSuperviser.map(user => user.mobile);

                if (userIds.length > 0) {
                    reportFilter = {
                        AgentPhoneNumber: {
                            [Op.in]: userIds
                        }
                    };
                }
            }

            const users = await User.findAll({
                attributes: [
                    [
                        fn('SUM', literal('CASE WHEN user_type = 1 THEN 1 ELSE 0 END')),
                        'admins'
                    ],
                    [
                        fn('SUM', literal('CASE WHEN user_type = 2 THEN 1 ELSE 0 END')),
                        'supervisors'
                    ],
                    [
                        fn('SUM', literal('CASE WHEN user_type = 3 THEN 1 ELSE 0 END')),
                        'agents'
                    ],
                ],
                where: userFilter
            });

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
                    'AgentPhoneNumber',
                ],
                order: [['createdAt', 'DESC']],
                where: reportFilter,
                include: [{
                    model: User,
                    attributes: ['mobile', 'id', 'name', 'email', 'user_type', 'is_active'],
                    required: false, // Use left outer join
                    on: {
                        '$AgentData.AgentPhoneNumber$': { [Op.col]: 'User.mobile' }
                    }
                }]
            });

            // Ensure reports and users are retrieved correctly
            console.log('Users:', users);
            console.log('Reports:', reports);

            if (reports.length === 0 || users.length === 0) {
                apiResponse.successResponseWithData(res, 'No data found', {});
                return;
            }

            const combinedData = {
                reports: reports[0],
                users: users[0]
            };

            apiResponse.successResponseWithData(res, 'All details retrieved successfully', combinedData);
        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

module.exports = {
    getStats,
};
