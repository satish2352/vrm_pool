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
            let reportFilter = {
                user_id: userIds,
            };    
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
                const minutesAgoDateTime = moment().subtract(time, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        
                // Construct the query
                // reportFilter.updatedAt = {
                //     [Op.between]: [minutesAgoDateTime, currentDateTime]
                // };
               

            
            }
            

            var allReports=[];
            const fromTimeNew = new Date(fromdate+" "+fromtime+":00"); // From time in UTC
            const toTimeNew = new Date(todate+" "+totime+":59"); 
            var slots= await splitTimeIntoSlots(fromTimeNew,toTimeNew)
            // if()
            // const all_agent = await User.findAll({});
            const all_agent = await User.findAll({
                where:userFilter
            });
            console.log("all_agent");
            console.log(all_agent);
             for (let i = 0; i < all_agent.length; i++) {
                let agent_id = all_agent[i].id
                reportFilter.user_id = agent_id;
                for (let i = 0; i < slots.length; i++) {
                    const slot = slots[i];
                    reportFilter.updatedAt = {
                        [Op.between]: [slot.start_time, slot.end_time]
                    };
                    console.log("Start Time:", convertUTCtoIST(slot.start_time), "| End Time:", convertUTCtoIST(slot.end_time));

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
                            [
                                fn('SUM',  col('IncomingCalls')),
                                'slot'
                            ],                                      
                        ],
                        where: reportFilter,
                        include: [{
                            model: User,
                            attributes: ['mobile', 'id', 'name','email', 'user_type', 'is_active'],                
                        }],
                        group: ['user_id'], 
                        order: [['createdAt', 'DESC']]
                    });                
                    //allReports.push({ slot: slot, reports: reports });
                    if(reports.length>0)
                    {
                    reports[0]['DeviceOnHumanReadable']=slot                              
                    allReports.push(reports[0])
                    }
                    
                }
             }
            apiResponse.successResponseWithDataSlotWise(res, 'All details get successfully', allReports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

function convertUTCtoIST(utcDate) {
    // Convert UTC date string to JavaScript Date object
    const utcDateTime = new Date(utcDate);

    // Get the UTC time in milliseconds
    const utcTime = utcDateTime.getTime();

    // Calculate the Indian Standard Time (IST) offset in milliseconds (GMT+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;

    // Add IST offset to UTC time to get IST time
    const istTime = new Date(utcTime + istOffset);

    return istTime;
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
