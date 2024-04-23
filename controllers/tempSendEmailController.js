const AWS = require('aws-sdk');
const { exec } = require('child_process');
const apiResponse = require("../helpers/apiResponse");


const sentTempEmail = [
    async (req, res) => {
      try {
        // Configure the AWS SDK to automatically use IAM role credentials
AWS.config.update({ region: 'ap-south-1' }); // Use Mumbai region

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



// // Method 2: Using AWS CLI to send email
// const awsCliCommand = `aws ses send-email --from sender@example.com --to recipient@example.com --subject "Test Email" --text "This is a test email"`;

// exec(awsCliCommand, (err, stdout, stderr) => {
//     if (err) {
//         console.error('Error sending email via AWS CLI:', err);
//     } else {
//         console.log('Email sent successfully via AWS CLI');
//         console.log('STDOUT:', stdout);
//         console.error('STDERR:', stderr);
//     }
// });

module.exports = {
    sentTempEmail
  };
  
