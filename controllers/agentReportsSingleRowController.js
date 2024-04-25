const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const moment = require('moment-timezone');

User.hasMany(AgentData, { foreignKey: 'user_id' });
AgentData.belongsTo(User, { foreignKey: 'user_id' });

const getAgentReportsSingleRow = [
    verifyToken,
    async (req, res) => {
        try {
            const { user_type, fromdate, todate, status,  supervisor_id,agent_id,direction ,fromtime,totime,time} = req.body;

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


                var fromTimeNew = new Date(fromdate+" "+fromtime+":00"); // From time in UTC
                var toTimeNew = new Date(todate+" "+totime+":59"); 
                console.log(fromTimeNew)
                console.log(toTimeNew)
                fromTimeNew=new Date(fromTimeNew.getTime() - 60 * 60000)
                toTimeNew=new Date(toTimeNew.getTime() - 60 * 60000)
                const fromTimeUTC = new Date(fromTimeNew.getTime() - fromTimeNew.getTimezoneOffset() * 60000);

// Convert toTimeNew to UTC
const toTimeUTC = new Date(toTimeNew.getTime() - toTimeNew.getTimezoneOffset() * 60000);
                reportFilter.updatedAt = {
                    //[Op.between]: [fromdate+" "+fromtime+":00", todate+" "+totime+":59"]
                    [Op.between]: [fromTimeUTC, toTimeUTC]
                };
            }
            if (status) {
                reportFilter.status = status;
            }

            if (direction) {
                reportFilter.direction = direction;
            }
            // if (time) {
            //     // Calculate the current date and time in the 'Asia/Kolkata' timezone
            //     const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        
            //     // Calculate the date and time 'minutes' minutes ago in the 'Asia/Kolkata' timezone
            //     const minutesAgoDateTime = moment().subtract(time, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        
            //     // Construct the query
            //     reportFilter.updatedAt = {
            //         [Op.between]: [minutesAgoDateTime, currentDateTime]
            //     };
        
            //     // Example: execute your query using Sequelize or perform any other actions needed
            // }


            // Fetch reports based on filters
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
                    'DeviceOnHumanReadable',
                   // [fn('COUNT', col('duration')), 'total_calls'],                    
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
    getAgentReportsSingleRow,
};
