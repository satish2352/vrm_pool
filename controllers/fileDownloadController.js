const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const UsersCopy = require("../models/UsersCopy");
const path = require('path');
const excelJS = require("exceljs")
const workbook = new excelJS.Workbook();

const downloadFile = [
  async (req, res) => {
    try {


      const { fileId } = req.query;
      console.log(fileId)
      // Fetch reports from the database
      let reports;
      var selectedColumns;
      if (fileId) {
        selectedColumns = ['fname', 'mname', 'lname', 'email', 'mobile', 'is_inserted', 'reason', 'updatedAt'];
        
        const reports = await UsersCopy.findAll({
          where: {
            fileId: fileId
          }
        });      
        const columns = selectedColumns.map(columnName => ({
          header: columnName.replace(/\s+/g, ''), // Remove spaces from column name
          key: columnName
        }));
        const worksheet = workbook.addWorksheet();
        worksheet.columns = columns;
        if (!reports.length) {
          console.log("No reports found");
          return apiResponse.successResponse(res, "No reports found", []);
        }

        reports.forEach(report => {
          const rowData = selectedColumns.map(columnName => report[columnName]);
          worksheet.addRow(rowData);
        });

        // Write the workbook to the response object 
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${fileId}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
      }
      else {
        return res.status(400).send({ result: false, message: "Enter valid report type" })
      }


      // If no reports found, send a response with an appropriate message

    } catch (error) {
      console.error("Error downloading file:", error);
      return apiResponse.ErrorResponse(res, "Error downloading file");
    }
  },
];







module.exports = {
  downloadFile,
};
