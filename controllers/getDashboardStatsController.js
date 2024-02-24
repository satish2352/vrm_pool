const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const User = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");

User.hasMany(Report, { foreignKey: 'user_id' });
Report.belongsTo(User, { foreignKey: 'user_id' });

const getStats = [
    verifyToken,
    async (req, res) => {
        try {           
            const users = await User.findAll({
                attributes: [                
                    [
                        fn('SUM', literal('CASE WHEN user_type = "1" THEN 1 ELSE 0 END')),
                        'admins'
                    ],
                    [
                        fn('SUM', literal('CASE WHEN user_type = "2" THEN 1 ELSE 0 END')),
                        'supervisors'
                    ],
                    [
                        fn('SUM', literal('CASE WHEN user_type = "3" THEN 1 ELSE 0 END')),
                        'agents'
                    ],
                ],
                
            });                   
            const reports = await Report.findAll({
                attributes: [
                    [
                        fn('SUM', literal('CASE WHEN status = "Completed" THEN 1 ELSE 0 END')),
                        'completed_count'
                    ],
                    [
                        fn('SUM', literal('CASE WHEN status = "Missed" THEN 1 ELSE 0 END')),
                        'missed_count'
                    ],
                    [
                        fn('SUM', literal('CASE WHEN direction = "Incoming" THEN 1 ELSE 0 END')),
                        'incoming_count'
                    ],
                    [
                        fn('SUM', literal('CASE WHEN direction = "Outgoing" THEN 1 ELSE 0 END')),
                        'outgoing_count'
                    ],
                    [
                        fn('SUM', col('duration')),
                        'total_duration'
                    ],
                    [
                        fn('AVG', col('duration')),
                        'average_duration'
                    ],
                    [fn('COUNT', col('duration')), 'total_calls'],
                ],             
                order: [['createdAt', 'DESC']]
            });
            
           var combinedData=({
            reports: reports[0],
            users: users[0] 

           });

            apiResponse.successResponseWithData(res, 'All details get successfully', combinedData);
        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

module.exports = {
    getStats,
};
