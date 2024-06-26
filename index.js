// const express = require("express");
// const apiRouter = require("./apiRouter");
// const app = express();
// var bodyParser = require('body-parser')
// app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.json());
// const dbObj = require("./db");
// var cors = require('cors')
// require('dotenv').config();

// app.use(cors());
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// app.use("/api/", apiRouter);


// module.exports = app;


//Satish COde
const express = require("express");
const apiRouter = require("./apiRouter");
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const moment = require('moment-timezone');

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

var logPath=process.env.LOG_PATH;

const customTimestamp = () => {
  return moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
};
   
//prettyPrint()
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: customTimestamp }), // Use custom timestamp format
    prettyPrint()
  ),
  transports: [
    new DailyRotateFile({
      filename: `${logPath}/log/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      level: 'error',
      filename: `${logPath}/log/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
  ],
});


const accessLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: customTimestamp }), // Use custom timestamp format
    winston.format.simple()
  ),
  transports: [
    new DailyRotateFile({
      filename: `${logPath}/log/access-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
});

app.use((req, res, next) => {
  accessLogger.info(`${req.method} ${req.url} ${res.statusCode} ${JSON.stringify(req.body)}${JSON.stringify(req.headers)}${JSON.stringify(req.query)}`);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();

  // Capture the original send function
  const originalSend = res.send.bind(res);

  // Override the send function to capture the response body
  res.send = (body) => {
    const responseTime = Date.now() - start;
    logger.info({
      message: 'HTTP Request and Response',
      method: req.method,
      url: req.url,
      headers: req.headers,
      requestBody: req.body,
      responseBody: body,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
    return originalSend(body);
  };

  next();
});

// Database connection
const dbObj = require("./db");

// CORS middleware
app.use(cors());

const PORT = process.env.PORT || 3000;

app.listen(PORT,'0.0.0.0', () => {
//  console.log(`Server is running on port ${PORT}`);
});

// API routes
app.use("/api/", apiRouter);

module.exports = app;
