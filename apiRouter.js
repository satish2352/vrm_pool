const router = require("express").Router();
const express = require("express");
var app = express();
const usersController = require("./controllers/usersController");

router.post("/addusers", usersController.addusers);

module.exports = router;