const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');

const getReports = [
  body(),
  verifyToken,
  async (req, res) => {
    const user_type = req.user_type; // Filter by role

    try {
      const { user_type, fromdate, todate, status } = req.body;

      // Step 1: Filter users based on user_type if provided
      let userFilter = {}; // Initialize an empty filter object
      if (user_type) {
        userFilter = {
          user_type: user_type
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
        from_number: mobileNumbers
      };

      // Add optional filters if provided by the user
      if (fromdate && todate) {
        reportFilter.start_time = {
          [Op.between]: [fromdate, todate] // Filter by createdAt between fromdate and todate
        };
      }
      if (status) {
        reportFilter.status = status; // Filter by status
      }

      const reports = await Report.findAll({
        where: reportFilter
      });

      res.json(reports);
    } catch (error) {
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];
// Filter by status






module.exports = {
  getReports,
};
// const userMobiles = await User.findAll({
//   attributes: ['mobile'], // Selecting only the mobile column
//   where: {
//     user_type: 2
//   }
// });

// // Extracting mobile numbers from the result
// const mobileNumbers = userMobiles.map(user => user.mobile);

// // Step 2: Fetch reports where from_number matches any of the mobile numbers obtained from step 1
// const reports = await Report.findAll({
//   where: {
//     from_number: mobileNumbers
//   }
// });

// res.json(reports);