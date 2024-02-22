const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const UsersCopy = require("../models/UsersCopy");
const path = require('path');


const downloadFile = [
  body(),
  async (req, res) => {
    try{
        const filePath = './exports/userCopy_1708574351218_dummyUsers.xlsx';
        // Sending the file along with its path in the response
        res.sendFile(path.resolve(filePath), (err) => {
            if (err) {
                console.error('Error sending file: ', err);
                res.status(err.status).end();
            } else {
                console.log('File sent successfully');
            }
        });
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occured during api call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];
// Filter by status






module.exports = {
    downloadFile,
};
