const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
require('dotenv').config();

var logPath=process.env.LOG_PATH;
// Define log file path
const logsDir = path.resolve(__dirname, '..', `${logPath}`, 'webhook');
const filename = path.join(logsDir, 'agent-call-record-logs-%DATE%.log');

const logger = winston.createLogger({
  level: 'info', // Set log level
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Log to console
    new DailyRotateFile({
      filename: filename,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m', // Optional: Maximum size of log file before rotation
      maxFiles: '14d' // Optional: Maximum number of days to keep log files
    })
  ]
});

module.exports = logger;
