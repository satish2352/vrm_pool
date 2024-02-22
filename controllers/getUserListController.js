const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const Users = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const UsersCopy = require("../models/UsersCopy");


const getUserList = [
  body(),
  verifyToken,
  async (req, res) => {
    const user_type = req.body.user_type; // Filter by role
  
    try {

      // Step 1: Filter users based on user_type if provided
      let userFilter = {}; // Initialize an empty filter object      
      if (user_type) {
        userFilter = {
          user_type: user_type
        };
      }      
      const userMobiles = await Users.findAll({
        where: userFilter, 
        order: [['id', 'DESC']]           
      });

      apiResponse.successResponseWithData(res, 'All details get successfully', userMobiles);
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occured during api call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];

module.exports = {
    getUserList,
};
