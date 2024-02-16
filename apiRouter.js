const router = require("express").Router();
const express = require("express");
var app = express();
const usersController = require("./controllers/usersController");
const { body, query, validationResult } = require("express-validator");



router.post("/addusers",usersController.addusers);

module.exports = router;

