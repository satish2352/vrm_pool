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

            const fromTime = new Date('2024-04-22T18:30:00Z'); // From time in UTC
            const toTime = new Date('2024-04-22T20:30:00Z'); 
            var slots= await splitTimeIntoSlots(fromTime,toTime)
            console.log(slots)
            // Fetch reports based on filters
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
            if (time) {
                // Calculate the current date and time in the 'Asia/Kolkata' timezone
                const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        
                // Calculate the date and time 'minutes' minutes ago in the 'Asia/Kolkata' timezone
                const minutesAgoDateTime = moment().subtract(time, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        
                // Construct the query
                // reportFilter.updatedAt = {
                //     [Op.between]: [minutesAgoDateTime, currentDateTime]
                // };
               

             
                // Example: execute your query using Sequelize or perform any other actions needed
            }
            

            var allReports=[];
            for (let i = 0; i < slots.length; i++) {

                console.log("inside")
                const slot = slots[i];
                reportFilter.updatedAt = {
                    [Op.between]: ['2024-04-22 19:40:05', '2024-04-22 20:50:05']
                };
                console.log("Start Time:", slot.start_time, "| End Time:", slot.end_time);
        
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
                console.log(reports)

                allReports.push(reports)
              }

              const distinctUsers = {};

// Iterate over each slot's reports
allReports.forEach(slotReports => {
    // Iterate over reports in the current slot
    slotReports.forEach(report => {
        const userId = report.user.id;

        // Check if the user already exists in distinctUsers
        if (!distinctUsers[userId]) {
            // If user doesn't exist, add the user to distinctUsers with the report
            distinctUsers[userId] = report;
        } else {
            // If user exists, update the report with the values from the current report
            Object.assign(distinctUsers[userId], report);
        }
    });
});

// Convert the distinctUsers object into an array
const mergedReports = Object.values(distinctUsers);

console.log(mergedReports);

            apiResponse.successResponseWithData(res, 'All details get successfully', allReports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

function roundToNearest30Minutes(time) {
    let [hours, minutes] = time.split(':').map(Number);
    let roundedMinutes = Math.round(minutes / 30) * 30;
    if (roundedMinutes === 60) {
        hours++;
        roundedMinutes = 0;
    }
    return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}

function generateTimeSlots(startTime, endTime, interval) {
    let timeSlots = [];
    let current = new Date("January 1, 2024 " + startTime);
    let end = new Date("January 1, 2024 " + endTime);
    while (current <= end) {
        let time = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeSlots.push(time);
        current.setTime(current.getTime() + interval * 60000); // Adding interval minutes
    }
    return timeSlots;
}

async function splitTimeIntoSlots(fromTime, toTime) {
    const records = [];
    let currentTime = new Date(fromTime);
  
    while (currentTime <= toTime) {
      const slotStartTime = new Date(currentTime);
      const slotEndTime = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
  
      records.push({ start_time: slotStartTime, end_time: slotEndTime });
  
      // Move to the next 30-minute slot
      currentTime = slotEndTime;
    }
  
    return records;
  }
module.exports = {
    getAgentReportsSingleRow,
};
