const router = require("express").Router();
const express = require("express");
const usersController = require("./controllers/usersController");
const loginController = require("./controllers/loginController");
const getUserController = require("./controllers/getUserController");
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
 const logoutController = require("./controllers/logoutController");
 const downloadReportsController = require("./controllers/downloadReportsController");
const resetPasswordController = require("./controllers/resetPasswordController");
const sendOTPController = require("./controllers/sendOTPController");
const changeUserStatusController = require("./controllers/changeUserStatusController");
const deleteUserController = require("./controllers/deleteUserController");
const adminUserPasswordResetController = require("./controllers/adminUserPasswordResetController");
const updateUserController = require("./controllers/updateUserController");
const { body, query, validationResult } = require("express-validator");



router.post("/addusers",usersController.addusers);
router.post("/login",loginController.loginUser);
router.post("/getUser",getUserController.getUser);
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
router.post("/logout",logoutController.logOut);
router.post("/resetPassword",resetPasswordController.resetPassword);
router.post("/sendOTP",sendOTPController.sendOTP);
router.post("/changeUserStatus",changeUserStatusController.changeUserStatus);
router.post("/deleteUser",deleteUserController.deleteUser);
router.get("/downloadReports",downloadReportsController.downloadReports);
router.post("/resetUserPassword",adminUserPasswordResetController.resetUserPassword);
router.post("/updateUser",updateUserController.updateUser);
router.post("/getReportsSingleRow",reportExotelController.getReportsSingleRow);



router.get("/",function(req,res){
    return res.status(200).send({message:"Welcome............"});
});

module.exports = router;

