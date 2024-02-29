const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const Users = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const UsersCopy = require("../models/UsersCopy");


const getAgents = [
  body(),
  verifyToken,
  async (req, res) => {
    const superviserId = req.body.superviserId; // Filter by role
  
    try {

      // Step 1: Filter users based on user_type if provided
      let userFilter = {
        is_active: 1,
        is_deleted: 0
      };  // Initialize an empty filter object      
      if (superviserId) {
        userFilter = {
          added_by: superviserId
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
    getAgents,
};
