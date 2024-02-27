const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const excelJS = require("exceljs")

const downloadReports = [
  async (req, res) => {    

    try {
      const { user_type, fromdate, todate, status, id } = req.query;

      // Step 1: Filter users based on user_type if provided
      let userFilter = {}; // Initialize an empty filter object
      if (user_type) {
        userFilter = {
          user_type: user_type
        };
      }
      if (id) {
        userFilter = {
          id: id
        };
      }

      const userMobiles = await User.findAll({
        attributes: ['mobile'], // Selecting only the mobile column
        where: userFilter // Apply the filter
      });

      // Extracting mobile numbers from the result
      const mobileNumbers = userMobiles.map(user => user.mobile);

      // Step 2: Construct the filter object for reports
      const reportFilter = {
        mobile: mobileNumbers
      };

      // Add optional filters if provided by the user
      if (fromdate && todate) {
        reportFilter.start_time = {
          [Op.between]: [fromdate, todate] // Filter by createdAt between fromdate and todate
        };
      }
      if (status) {
        reportFilter.status = status; // Filter by status
      }


      const reports = await Report.findAll({
        where: reportFilter,
        order: [['updatedAt', 'DESC']]
      });
      selectedColumns = ['exotel_number', 'mobile', 'from_name', 'to_number', 'to_name','status', 'start_time', 'end_time', 'duration', 'price','recording_url', 'price_details', 'group_name', 'from_circle', 'to_circle','leg1_status', 'leg2_status', 'conversation_duration', 'app_id', 'app_name','digits', 'disconnected_by', 'fileId', 'updatedAt'];         
      const workbook = new excelJS.Workbook();
       const columns = selectedColumns.map(columnName => ({
          header: columnName.replace(/\s+/g, ''), // Remove spaces from column name
          key: columnName
        }));
  
        let worksheet;
      
          worksheet = workbook.addWorksheet();
          worksheet.columns = columns;        
          worksheet = workbook.getWorksheet(1); // Get the first worksheet
        
  
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
        res.setHeader("Content-Disposition", `attachment; filename=report.xlsx`);
        await workbook.xlsx.write(res);
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occured during api call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];
// Filter by status








module.exports = {
    downloadReports,
};
