const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const { body, query, validationResult } = require("express-validator");
const sequelize = require('../db');
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
const UsersCopy = require("../models/UsersCopy");
const path = require('path');
const excelJS=require("exceljs")
const workbook = new excelJS.Workbook(); 



const downloadFile = [
  //body("fileId", "INvalid FileId").isLength({ min: 1, max: 100 }),
  //verifyToken,
  async (req, res) => {
    try {
     
      //const { fileId} = req.fileId;
      console.log("fileId")
      //console.log(fileId)
      const worksheet = workbook.addWorksheet();
      // Fetch reports from the database
      const reports = await Report.findAll({
        where:{
          fileId:'1708680397229_bulkcsvdata.csv'
        }
      });

      // If no reports found, send a response with an appropriate message
      if (!reports.length) {
          console.log("No reports found");
          return apiResponse.successResponse(res, "No reports found", []);
      }

      // 'exotel_number', 'mobile', 'from_name', 'to_number', 'to_name', 'status', 'start_time', 'end_time', 'duration', 'price', 'recording_url', 'price_details', 'group_name', 'from_circle', 'to_circle', 'leg1_status', 'leg2_status', 'conversation_duration', 'app_id', 'app_name', 'digits', 'disconnected_by', 'fileId', 'createdAt', 'updatedAt'

     const selectedColumns = ['exotel_number', 'mobile', 'from_name', 'to_number', 'to_name','status', 'start_time', 'end_time', 'duration', 'price','recording_url', 'price_details', 'group_name', 'from_circle', 'to_circle','leg1_status', 'leg2_status', 'conversation_duration', 'app_id', 'app_name','digits', 'disconnected_by', 'fileId', 'updatedAt'];
      // Get the column names dynamically from the first report object
      //const columnNames = Object.keys(reports[0].dataValues);

       // Create columns dynamically based on the column names
       const columns = selectedColumns.map(columnName => ({
        header: columnName.replace(/\s+/g, ''), // Remove spaces from column name
        key: columnName,
        width: 20 // Set your preferred width here
    }));
  



      // Add columns to the worksheet
      worksheet.columns = columns;

      // Add data to the worksheet
      reports.forEach(report => {
          const rowData = selectedColumns.map(columnName => report[columnName]);
          worksheet.addRow(rowData);
      });

      // Write the workbook to the response object 
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); 
      res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");
      await workbook.xlsx.write(res);
      res.end();
  } catch (error) {
      console.error("Error downloading file:", error);
      return apiResponse.ErrorResponse(res, "Error downloading file");
  }
  },
];







module.exports = {
    downloadFile,
};
