const router = require("express").Router();
const express = require("express");
var app = express();
const usersController = require("./controllers/usersController");
const { body, query, validationResult } = require("express-validator");



router.post("/addusers",[
    body('email', 'Enter valid email id').isEmail(),
    body('fname', 'Enter valid first name min 2 characters').isLength({ min: 2, max: 100 }),
    body('mname', 'Enter valid middle name min 2 characters').isLength({ min: 2, max: 100 }),
    body('lname', 'Enter valid last name min 2 characters').isLength({ min: 2, max: 100 }),
    body('mobile', 'Enter valid mobile number').isLength({ min: 10, max: 10 }),
    body('password', 'Enter valid password min 8 digits').isLength({ min: 8, max: 100 }),
    body('user_type', 'Enter valid role').isLength({ min: 1, max: 3 })], usersController.addusers);

module.exports = router;

