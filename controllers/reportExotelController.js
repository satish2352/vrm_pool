const verifyToken = require("../middleware/verifyToken");
// const Report = require("../models/Report");
const { Report, dbObj } = require('../models/Report');

const User = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");

User.hasMany(Report, { foreignKey: 'user_id' });
Report.belongsTo(User, { foreignKey: 'user_id' });

const getReportsSingleRow = [
    verifyToken,
    async (req, res) => {
        try {
            const { user_type, fromdate, todate, status,  supervisor_id,agent_id,direction ,fromtime,totime} = req.body;

            // Construct filter for Users
            let userFilter = {
                is_active:1,
                is_deleted:0
               }; 
            if (user_type) {
                userFilter.user_type = user_type;
            }
            if (supervisor_id) {
                userFilter.added_by = supervisor_id;
            }

            if (Array.isArray(agent_id)) {
                if (agent_id.length === 0) {
                  
                } else {
                    if (agent_id) {
                        userFilter.id = agent_id;
                    }
                }
              } else {
                
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
            // if (fromdate && todate) {
            //     reportFilter.updatedAt = {
            //         [Op.between]: [fromdate+" 00:00:00", todate+" 23:59:59"]
            //     };
            // }
            if ((fromdate && todate) &&  (! fromtime && ! totime)) {
                reportFilter.updatedAt = {
                    [Op.between]: [fromdate+" 00:00:00", todate+" 23:59:59"]
                };
            }

            if ((fromdate && todate) && (fromtime && totime)) {
                reportFilter.updatedAt = {
                    [Op.between]: [fromdate+" "+fromtime+":00", todate+" "+totime+":59"]
                };
            }
            if (status) {
                reportFilter.status = status;
            }

            if (direction) {
                reportFilter.direction = direction;
            }


            // Fetch reports based on filters
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
                where: reportFilter,
                include: [{
                    model: User,
                    attributes: ['mobile', 'id', 'name','email', 'user_type', 'is_active'],
                }],
                group: ['user_id'], 
                order: [['createdAt', 'DESC']]
            });

            apiResponse.successResponseWithData(res, 'All details get successfully', reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

module.exports = {
    getReportsSingleRow,
};
