const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const { body, query, validationResult } = require("express-validator");
User.hasMany(AgentData, { foreignKey: 'user_id' });
AgentData.belongsTo(User, { foreignKey: 'user_id' });

const getStats = [
    body(),
    verifyToken,
    async (req, res) => {
        try {        
            const { id } = req.body;
            let userFilter={
                is_deleted: '0',
                is_active:'1'
            }
            let reportFilter={}
            if(id){
                userFilter = {
                    added_by:id,
                    is_deleted: '0',
                    is_active:'1'
                    };

                    const usersUnderSuperviser = await User.findAll({
                        where: userFilter,
                    });
                    const userIds = usersUnderSuperviser.map(user => user.id);
                      // Construct filter for Reports
             reportFilter = {
                user_id: userIds,
            };
            }
             
            

            // Extract user IDs for filtering reports
            

          
            
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
                where:userFilter
                
            });                   
            const reports = await AgentData.findAll({
                attributes: [
                    [
                        fn('SUM',  col('IncomingCalls')),
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
                ],             
                order: [['createdAt', 'DESC']],
                where:reportFilter
            
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
