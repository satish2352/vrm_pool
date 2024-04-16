const express = require("express");
const apiRouter = require("./apiRouter");
const app = express();
var bodyParser = require('body-parser')
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded());
app.use(express.json());
const dbObj = require("./db");
var cors = require('cors')
require('dotenv').config();
const moment = require('moment-timezone');

// Set default timezone for your application
// moment.tz.setDefault('Asia/Kolkata');
process.env.TZ = 'Asia/Kolkata'; // Change 'UTC' to your desired time zone

app.use(cors());
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api/", apiRouter);


module.exports = app;
