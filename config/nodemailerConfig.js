const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_HOST=process.env.EMAIL_HOST
const EMAIL_PORT=process.env.EMAIL_PORT
const EMAIL_USER=process.env.EMAIL_USER
const EMAIL_PASSWORD=process.env.EMAIL_PASSWORD

// Function to create and configure the Nodemailer transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
}

console.log(EMAIL_HOST)
console.log(EMAIL_PORT)
console.log(EMAIL_USER)
console.log(EMAIL_PASSWORD)
module.exports = createTransporter;
