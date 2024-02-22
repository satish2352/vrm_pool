const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const UsersCopy = require("../models/UsersCopy");


const getUserHistory = [
  body(),
  verifyToken,
  async (req, res) => {
    const fileId = req.fileId; // Filter by role
    const user_type = req.user_type; // Filter by role
    try {
      const { fileId} = req.body;

      // Step 1: Filter users based on user_type if provided
      let userFilter = {}; // Initialize an empty filter object
      if (fileId) {
        userFilter = {
            fileId: fileId
        };
      }
      if (user_type) {
        userFilter = {
          user_type: user_type
        };
      }  

      const userMobiles = await UsersCopy.findAll({
        attributes: ['fileId'], // Selecting only the mobile column
        where: userFilter,
        group: ['fileId'],
        order: [['id', 'DESC']]       // Apply the filter
      });

   
      apiResponse.successResponseWithData(res, 'All details get successfully', userMobiles);
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occured during api call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];
// Filter by status






module.exports = {
    getUserHistory,
};
