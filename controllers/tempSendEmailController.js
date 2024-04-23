const AWS = require('aws-sdk');
const { exec } = require('child_process');
const apiResponse = require("../helpers/apiResponse");


const sentTempEmail = [
    async (req, res) => {
      try {
        // Configure the AWS SDK to automatically use IAM role credentials
AWS.config.update({ region: 'ap-south-1' }); // Use Mumbai region
AWS.config.credentials = new AWS.EC2MetadataCredentials();

// Create a new SES object
const ses = new AWS.SES();

// Construct email parameters
const params = {
    Destination: {
        ToAddresses: ['vugore@gmail.com']
    },
    Message: {
        Body: {
            Text: { Data: 'This is a test email' }
        },
        Subject: { Data: 'Test Email' }
    },
    Source: 'noreply@exotel.in' // Replace with your sender email address
};

// Method 1: Using AWS SDK to send email
ses.sendEmail(params, (err, data) => {
    if (err) {
        console.log('Error sending email via AWS SDK:', err);
        return apiResponse.ErrorResponse(res, `Error sending email via AWS SDK ${err}`);
    } else {
        console.log('Email sent successfully via AWS SDK:', data);
        return  apiResponse.successResponseWithData(res, 'All details get successfully', reports);
    }
});
    
      } catch (error) {
        console.error("Error Sending Email ", error);
        return apiResponse.ErrorResponse(res, "Error Sending Email");
      }
    },
  ];

module.exports = {
    sentTempEmail
  };
  
