const verifyToken = require("../middleware/verifyToken");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const apiResponse = require("../helpers/apiResponse");
const NotFoundAgentCallDetails = require("../models/NotFoundAgentCallDetails");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize


const getAgentNotInsertCallDetails = [
  body(),
  verifyToken,
  async (req, res) => {
    const url = req.body.fileUrl; // Filter by role

    console.log(fileUrl);
    try {
        var results; 
        results = await NotFoundAgentCallDetails.findAll({
          where: {
            fileUrl:fileUrl
          },
          order: [['id', 'DESC']], 
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
