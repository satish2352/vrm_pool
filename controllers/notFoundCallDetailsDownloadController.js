const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const NotFoundAgentCallDetails = require("../models/NotFoundAgentCallDetails");
const path = require('path');
const excelJS = require("exceljs");

const downloadNotInsertedDetailsFile = [
  async (req, res) => {
    try {
      const { fileUrl } = req.query;

      console.log(fileUrl)



      // Get all columns from the UsersCopy model
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
        console.log("No reports found");
        return apiResponse.successResponse(res, "No reports found", []);
      }

      // Populate the worksheet with data
      reports.forEach(report => {
    
        worksheet.addRow(report);
      });

      var datetime=new Date.now();

      // Write the workbook to the response object
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${datetime}.xlsx`);
      await workbook.xlsx.write(res);
      res.end(); // Send response after writing is completed
    } catch (error) {
      console.error("Error downloading file:", error);
      return apiResponse.ErrorResponse(res, "Error downloading file");
    }
  },
];

module.exports = {
  downloadNotInsertedDetailsFile,
};
