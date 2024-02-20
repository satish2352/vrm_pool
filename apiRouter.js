const router = require("express").Router();
const express = require("express");
var app = express();
const usersController = require("./controllers/usersController");
const loginController = require("./controllers/loginController");
const getUserController = require("./controllers/getUserController");
const uploadBulkUsersController = require("./controllers/uploadBulkUsersController");
const uploadCSVController = require("./controllers/uploadCSVController");
const getReportsController = require("./controllers/getReportsController");
const { body, query, validationResult } = require("express-validator");



router.post("/addusers",usersController.addusers);
router.post("/login",loginController.loginUser);
router.post("/getUser",getUserController.getUser);
router.post("/uploadBulkUsers",uploadBulkUsersController.uploadUsers);
router.post("/uploadCSVData",uploadCSVController.uploadData);
router.post("/getReports",getReportsController.getReports);

module.exports = router;

