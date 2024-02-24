const router = require("express").Router();
const express = require("express");
var app = express();
const usersController = require("./controllers/usersController");
const loginController = require("./controllers/loginController");
const getUserController = require("./controllers/getUserController");
const uploadBulkUsersController = require("./controllers/uploadBulkUsersController");
const uploadCSVController = require("./controllers/uploadCSVController");
const getReportsController = require("./controllers/getReportsController");
const getUserInsertHistoryController = require("./controllers/getUserInsertHistoryController");
const getUserInserDetailsController = require("./controllers/getUserInserDetailsController");
const fileDownloadController = require("./controllers/fileDownloadController");
const getUserListController = require("./controllers/getUserListController");
const uploadSuperviserController = require("./controllers/uploadSuperviserController");
const uploadAgentsController = require("./controllers/uploadAgentsController");
const getAgentsBySuperviserController = require("./controllers/getAgentsBySuperviserController");
const getDashboardStatsController = require("./controllers/getDashboardStatsController");
const reportExotelController = require("./controllers/reportExotelController");
 const changePasswordController = require("./controllers/changePasswordController");
 const logOutController = require("./controllers/logOutController");
//const resetPasswordController = require("./controllers/resetPasswordController");
const { body, query, validationResult } = require("express-validator");



router.post("/addusers",usersController.addusers);
router.post("/login",loginController.loginUser);
router.post("/getUser",getUserController.getUser);
router.post("/uploadBulkUsers",uploadBulkUsersController.uploadUsers);
router.post("/uploadCSVData",uploadCSVController.uploadData);
router.post("/getReports",getReportsController.getReports);
router.post("/getUserInsertHistory",getUserInsertHistoryController.getUserHistory);
router.post("/getUserInsertDetails",getUserInserDetailsController.getUserInsertDetails);
router.get("/downloadFile",fileDownloadController.downloadFile);
router.post("/getUserList",getUserListController.getUserList);
router.post("/uploadSupervisers",uploadSuperviserController.uploadSupervisers);
router.post("/uploadAgents",uploadAgentsController.uploadAgents);
router.post("/getAgentsBySuperviser",getAgentsBySuperviserController.getAgents);
router.post("/getDashboardStats",getDashboardStatsController.getStats);
router.post("/changePassword",changePasswordController.changePassword);
router.post("/logout",logOutController.logOut);

//Exotel API
router.post("/getReportsSingleRow",reportExotelController.getReportsSingleRow);


// router.post("/resetPassword",resetPasswordController.resetPassword);


router.get("/",function(req,res){
    return res.status(200).send({message:"Welcome............"});
});

module.exports = router;

