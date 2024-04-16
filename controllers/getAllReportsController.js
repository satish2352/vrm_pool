const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const moment = require('moment-timezone');


const getAllReports = [
  body(),
  verifyToken,
  async (req, res) => {
    const user_type = req.user_type; // Filter by role

    try {
      const { user_type, fromdate, todate, status, id,supervisor_id,agent_id,direction ,fromtime,totime,time} = req.body;

      // Step 1: Filter users based on user_type if provided
      let userFilter = {
       
      }; // Initialize an empty filter object
      if (user_type) {
        userFilter = {
          user_type: user_type
        };
      }
      if (id) {
        userFilter = {
          id: id
        };
      }

      const userMobiles = await User.findAll({
        attributes: ['mobile'], // Selecting only the mobile column
        where: userFilter // Apply the filter
      });

      // Extracting mobile numbers from the result
      const mobileNumbers = userMobiles.map(user => user.mobile);

      // Step 2: Construct the filter object for reports
      const reportFilter = {
        AgentPhoneNumber: mobileNumbers
      };

      // Add optional filters if provided by the user
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
                reportFilter.updatedAt = {
                    [Op.between]: [minutesAgoDateTime, currentDateTime]
                };
        
                // Example: execute your query using Sequelize or perform any other actions needed
            }



      const reports = await AgentData.findAll({
        where: reportFilter,
        order: [['updatedAt', 'DESC']]
      });

      apiResponse.successResponseWithData(res, 'All details get successfully', reports);
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occured during api call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];
// Filter by status








module.exports = {
  getAllReports,
};
