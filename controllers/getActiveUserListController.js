const verifyToken = require("../middleware/verifyToken");
const Users = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
require('dotenv').config();


const getActiveUserList = [
  body(),
  verifyToken,
  async (req, res) => {
    const user_type = req.body.user_type; // Filter by role
    const superviserId = req.body.superviserId; // Filter by role
    const { page = 1} = req.body;
    if(!page)
      {
          page=1;
      }
    var pageSize =process.env.PAGE_LENGTH
    const  customPageSize = req.body.pageSize;
    if(customPageSize)
      {
        pageSize =customPageSize
      }

      console.log('-----------------------------------')
      console.log(customPageSize)
    
    try {

      let userFilter ={};
      // Step 1: Filter users based on user_type if provided
      // Initialize an empty filter object      
      if (user_type) {
        console.log('-----------')
        userFilter = {
          user_type: user_type,
          is_deleted: 0,
          is_active: 1,
        }
      }else{
        userFilter = {
            user_type: [2, 3],
            is_deleted: 0,
            is_active: 1
          }     
      }
      if (superviserId) {
        userFilter = {
          added_by: superviserId,
          is_deleted: 0,
          is_active: 1
        };
      }
      // Pagination parameters
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      const { count, rows: reports } = await Users.findAndCountAll({
        attributes:['id','name','email','mobile','user_type','is_active','is_deleted'],
        where: userFilter, 
        order: [['id', 'DESC']],
        limit,
        offset,           
      });

      const totalPages = Math.ceil(count / pageSize);

      const resData = {
        result: true,
        data: reports,
        totalItems: count,
        totalPages: totalPages,
        currentPage: page,
        pageSize: pageSize,
      };

      return res.status(200).json(resData);
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occured during api call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];

module.exports = {
    getActiveUserList,
};
