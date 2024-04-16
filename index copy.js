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


app.use(cors());
const PORT = process.env.PORT || 3000;
const timezone = process.env.APP_TIMEZONE || 'Asia/Kolkata';
console.log(timezone);
const currentDateTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
console.log(currentDateTime);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api/", apiRouter);


module.exports = app;
