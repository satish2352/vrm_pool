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
      const { url } = req.query;

      if (!url) {
        return res.status(400).send({ result: false, message: "Enter valid report type" });
      }

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
        where: { fileUrl: url }
      });

      if (!reports.length) {
        console.log("No reports found");
        return apiResponse.successResponse(res, "No reports found", []);
      }

      // Populate the worksheet with data
      reports.forEach(report => {
        const rowData = attributes.map(attribute => {
          if (attribute === 'is_inserted') {
            // Conditionally pass "yes" or "no" based on the value of `is_inserted`
            return report.dataValues[attribute] === '1' ? 'yes' : 'no';
          }
          return report.dataValues[attribute];
        });
        worksheet.addRow(rowData);
      });

      // Write the workbook to the response object
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${fileId}.xlsx`);
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
