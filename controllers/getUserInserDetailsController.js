const verifyToken = require("../middleware/verifyToken");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const apiResponse = require("../helpers/apiResponse");
const UsersCopy = require("../models/UsersCopy");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize


const getUserInsertDetails = [
  body(),
  verifyToken,
  async (req, res) => {
    const fileId = req.body.fileId; // Filter by role
    const user_type = req.body.user_type; // Filter by role
    
    try {
     // const { fileId} = req.body;

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
      var results; 
      if(fileId)
      {
        results = await UsersCopy.findAll({
          where: userFilter,
          order: [['id', 'DESC']],                
          attributes:[
            'fileId',
            'createdAt',
            'updatedAt',
            'name',            
            'email',
            'mobile',
            'reason',
            'added_by',
            'is_inserted',
            
        ],
        limit: 5,
  
        });

      }else{
        console.log('else')
         results = await UsersCopy.findAll({
          where: userFilter,
          order: [['id', 'DESC']],
          group:['fileId'],
          attributes:[
            'fileId',
            'createdAt',
            'updatedAt',
            [
              fn('SUM', literal('CASE WHEN is_inserted = "1" THEN 1 ELSE 0 END')),
              'insertedCount'
          ],
          [
              fn('SUM', literal('CASE WHEN is_inserted = "0" THEN 1 ELSE 0 END')),
              'failedCount'
          ],  
                
        ],
        limit: 5,
  
        });
      }    
       

      

      apiResponse.successResponseWithData(res, 'All details get successfully', results);
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occured during api call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];

module.exports = {
    getUserInsertDetails,
};
