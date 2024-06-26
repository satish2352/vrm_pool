const router = require("express").Router();
const express = require("express");
const multer = require('multer');
const upload = multer();

const usersController = require("./controllers/usersController");
const loginController = require("./controllers/loginController");
const getUserController = require("./controllers/getUserController");
const getUserInsertHistoryController = require("./controllers/getUserInsertHistoryController");
const getUserInserDetailsController = require("./controllers/getUserInserDetailsController");
const fileDownloadController = require("./controllers/fileDownloadController");
const getUserListController = require("./controllers/getUserListController");
const uploadSuperviserController = require("./controllers/uploadSuperviserController");
const uploadAgentsController = require("./controllers/uploadAgentsController");
const getAgentsBySuperviserController = require("./controllers/getAgentsBySuperviserController");
const getDashboardStatsController = require("./controllers/getDashboardStatsController");
 const changePasswordController = require("./controllers/changePasswordController");
 const logoutController = require("./controllers/logoutController");
const resetPasswordController = require("./controllers/resetPasswordController");
const sendOTPController = require("./controllers/sendOTPController");
const changeUserStatusController = require("./controllers/changeUserStatusController");
const deleteUserController = require("./controllers/deleteUserController");
const adminUserPasswordResetController = require("./controllers/adminUserPasswordResetController");
const updateUserController = require("./controllers/updateUserController");
const agentDataDownloadController = require("./controllers/agentDataDownloadController");
const agentReportsSingleRowController = require("./controllers/agentReportsSingleRowController");
const getAgentReportsSingleTimeSlotWise = require("./controllers/getAgentReportsSingleTimeSlotWise");
const getAllReportsController = require("./controllers/getAllReportsController");
const uploadAgentsControllerNew = require("./controllers/uploadAgentsControllerNew");
const getActiveUserListController = require("./controllers/getActiveUserListController");
const notFoundCallDetailsDownloadController = require("./controllers/notFoundCallDetailsDownloadController");
const getAgentCallDetailsInsertController = require("./controllers/getAgentCallDetailsInsertController");


const getAgentReportsSingleTimeSlotWiseNew = require("./controllers/getAgentReportsSingleTimeSlotWiseNew");
const getAgentReportsSingleRowExportExcel = require("./controllers/agentReportSingleRowExportExcel");
const getAgentReportsSingleTimeSlotWiseExportExcel = require("./controllers/agentReportSingleTimeSlotWiseExportExcel");
const getActiveAllUsersListWithoutPaginationController = require("./controllers/getActiveAllUsersListWithoutPaginationController");



//const tempSendEmailController=require("./controllers/tempSendEmailController")

const { exec } = require('child_process');


const { body, query, validationResult } = require("express-validator");



router.post("/addusers",usersController.addusers);
router.post("/login",loginController.loginUser);
router.post("/getUser",getUserController.getUser);
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
router.post("/resetUserPassword",adminUserPasswordResetController.resetUserPassword);
router.post("/updateUser",updateUserController.updateUser);
router.post("/getAgentReportsSingleRow",agentReportsSingleRowController.getAgentReportsSingleRow);
router.post("/getAgentReportsSingleTimeSlotWise",getAgentReportsSingleTimeSlotWiseNew.getAgentReportsSingleRow);
router.post("/getagentcalldetails", upload.none(),agentDataDownloadController.getAgentCallDetails);
router.post("/getAllReports",getAllReportsController.getAllReports);
//router.post("/sentTempEmail",tempSendEmailController.sentTempEmail);
router.post("/getActiveUserList",getActiveUserListController.getActiveUserList);

router.get("/downloadNotInsertedDetailsFile",notFoundCallDetailsDownloadController.downloadNotInsertedDetailsFile);
router.post("/getAgentNotInsertCallDetails",getAgentCallDetailsInsertController.getAgentNotInsertCallDetails);

router.post("/getActiveUserListWithoutPagination",getActiveAllUsersListWithoutPaginationController.getActiveUserListWithoutPagination);
router.post("/getSingleRowExportExcel",getAgentReportsSingleRowExportExcel.getSingleRowExportExcel);
router.post("/getTimeSlotWiseExportExcel",getAgentReportsSingleTimeSlotWiseExportExcel.exportExcelTimeSlotWise);








router.post("/uploadAgentsNew",uploadAgentsControllerNew.uploadAgents);

router.post('/cronejob', (req, res) => {
    exec('sh dumpdata.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing the script: ${error}`);
        return res.status(500).send('Error executing the script');
      }
      console.error(`Script errors: ${stderr}`);
      res.send('Script executed successfully');
    });
  });
  








router.get("/",function(req,res){
    return res.status(200).send({message:"Welcome............"});
});

module.exports = router;

