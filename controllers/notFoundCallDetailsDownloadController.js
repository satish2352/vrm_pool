const verifyToken = require("../middleware/verifyToken");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const NotFoundAgentCallDetails = require("../models/NotFoundAgentCallDetails");
const path = require('path');
const excelJS = require("exceljs");
const { body, query, validationResult } = require("express-validator");

const downloadNotInsertedDetailsFile = [
  query('fileUrl').notEmpty().withMessage('fileUrl is required'),
  async (req, res) => {
    const retryDownload = async (attempt = 1) => {
      try {
        
        const checkErrorInValidations = validationResult(req);
        if (!checkErrorInValidations.isEmpty()) {
          return res.status(400).json({
              result: false,
              message: "Please enter valid fileUrl",
              errors: checkErrorInValidations.array(),
          });
        }

        const { fileUrl } = req.query;
        // Get all columns from the NotFoundAgentCallDetails model
        const attributes = Object.keys(NotFoundAgentCallDetails.rawAttributes);

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        // Map model attributes to worksheet columns
        const columns = attributes.map(attribute => ({
          header: attribute.replace(/\s+/g, ''), // Remove spaces from column name if any
          key: attribute
        }));
        worksheet.columns = columns;

        // Fetch reports from the database
        const reports = await NotFoundAgentCallDetails.findAll({
          where: { fileUrl: fileUrl }
        });

        if (!reports.length) {
          return res.status(200).json({
            result: false,
            message: "No records found",
          });
        }

        // Populate the worksheet with data
        reports.forEach(report => {
          worksheet.addRow(report);
        });

        const currentDateTimeInMillis = Date.now();


        // Write the workbook to the response object
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${currentDateTimeInMillis}.xlsx`);
        await workbook.xlsx.write(res);
        res.end(); // Send response after writing is completed
      } catch (error) {
        console.error(`Attempt ${attempt}: Error downloading file:`, error);
        if (attempt === 1) {
          console.log('Retrying download...');
          return retryDownload(attempt + 1);
        } else {
          console.log('Retry failed. Sending error response.');
          return apiResponse.ErrorResponse(res, "Error downloading file");
        }
      }
    };

    retryDownload();
  },
];

module.exports = {
  downloadNotInsertedDetailsFile,
};
