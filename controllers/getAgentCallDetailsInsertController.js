const verifyToken = require("../middleware/verifyToken");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const apiResponse = require("../helpers/apiResponse");
const NotFoundAgentCallDetails = require("../models/NotFoundAgentCallDetails");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize


const getAgentNotInsertCallDetails = [
  verifyToken,
  async (req, res) => {
    const fileUrl = req.body.fileUrl; // Filter by role
    console.log(fileUrl);
    try {
        var results; 
        results = await NotFoundAgentCallDetails.findAll({    
          order: [['id', 'DESC']],
          group:['fileUrl'],
          attributes:[
            [fn('COUNT', col('id')), 'totalCount'],
            'fileUrl',
            'createdAt',
            'updatedAt'                
        ], 
         });
      apiResponse.successResponseWithData(res, 'All details get successfully', results);
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occured during api call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];

module.exports = {
    getAgentNotInsertCallDetails,
};
