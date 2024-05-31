const verifyToken = require("../middleware/verifyToken");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const apiResponse = require("../helpers/apiResponse");
const NotFoundAgentCallDetails = require("../models/NotFoundAgentCallDetails");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize
require('dotenv').config();


const getAgentNotInsertCallDetails = [
  verifyToken,
  async (req, res) => {
    const fileUrl = req.body.fileUrl; // Filter by role
    var pageSize =process.env.PAGE_LENGTH
    const { page = 1} = req.body;
    if(!page)
      {
          page=1;
      }
    const  customPageSize = req.body.pageSize;
    if(customPageSize)
      {
        pageSize =customPageSize
      }
    try {
       // Pagination parameters
       const offset = (page - 1) * pageSize;
       const limit = parseInt(pageSize);

        var results; 
        const { count, rows: reports } = await NotFoundAgentCallDetails.findAndCountAll({
          order: [['id', 'DESC']],
          group:['fileUrl'],
          attributes:[
            [fn('COUNT', col('id')), 'totalCount'],
            'fileUrl',
            'createdAt',
            'updatedAt'
          ], 
        limit,
        offset,
         });
         const totalPages = Math.ceil(count.length / pageSize);
         const resData = {
             totalItems: count.length,
             totalPages: totalPages,
             currentPage: page,
             pageSize: pageSize,
             reports: reports
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
    getAgentNotInsertCallDetails,
};
