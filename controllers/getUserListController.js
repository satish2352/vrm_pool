const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const Users = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");


const getUserList = [
  body(),
  verifyToken,
  async (req, res) => {
    const user_type = req.body.user_type; // Filter by role
    const superviserId = req.body.superviserId; // Filter by role
  
    try {

      let userFilter ={};
      if(req.user.user_type=='1'){
        userFilter = 
        {          
          is_deleted: '0',
        };
      }else{
        userFilter = 
        {          
          is_deleted: '0',
          is_active:'1'
        };
      }
      // Step 1: Filter users based on user_type if provided
      // Initialize an empty filter object      
      if (user_type) {
        userFilter = {
          user_type: user_type,
          is_deleted: '0',
          is_active:'1'
        };
      }else{
        userFilter.user_type = [2, 3],
        userFilter.is_deleted= '0',
        userFilter.is_active='1'
      }
      if (superviserId) {
        userFilter = {
          added_by: superviserId
        };
      }

     
             
      const userMobiles = await Users.findAll({
        attributes:['id','name','email','mobile','user_type','is_active','is_deleted'],
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
