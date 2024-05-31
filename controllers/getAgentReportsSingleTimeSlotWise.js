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
            const { user_type,supervisor_id,agent_id ,fromtime,totime} = req.body;
            const { page = 1, pageSize = 100} = req.body;
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
            
            // Pagination parameters
            const offset = (page - 1) * pageSize;
            const limit = parseInt(pageSize);


            // const fromTimeNew = new Date(fromdate+" "+fromtime+":00"); // From time in UTC
            // const toTimeNew = new Date(todate+" "+totime+":59"); 
            var slots= await splitTimeIntoSlots(new Date(fromtime),new Date(totime))
            var allReports=[]
            const all_agent = await User.findAll({
                where:userFilter
            });
       
             for (let i = 0; i < all_agent.length; i++) {
                let agent_id = all_agent[i].id
                reportFilter.user_id = agent_id;
                for (let i = 0; i < slots.length; i++) {
                    const slot = slots[i];
                    reportFilter.updatedAt = {
                        [Op.between]: [slot.start_time, slot.end_time]
                    };                            
                   const { count, rows: reports } = await AgentData.findAll({
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
                        order: [['createdAt', 'DESC']],
                        limit,
                        offset,
                    });                
                    //allReports.push({ slot: slot, reports: reports });
                    if(reports.length>0)
                    {
                        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>-----------------------------------------------------');
                        console.log('reports lenth 0');
                    reports[0]['DeviceOnPercent']=slot                              
                    allReports.push(reports[0])
                    }else{
                        console.log('-----------------------------------------------------');
                        console.log('reports lenth 0');
                    }
                    
                }
             }
             const totalPages = Math.ceil(allReports.length / pageSize);
             var resData = {
                result: true,               
                data: allReports,
                totalItems: allReports.length,
                totalPages: totalPages,
                currentPage: page,
                pageSize: pageSize,
            };
            return res.status(200).json(resData);
            //apiResponse.successResponseWithDataSlotWise(res, 'All details get successfully', allReports);
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
     let currentTime = new Date(fromTime.getTime() - 60 * 60000); // Subtract 60 minutes from fromTime
     toTime = new Date(toTime.getTime() - 60 * 60000); // Subtract 60 minutes from t

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
