const AWS = require('aws-sdk');
const { exec } = require('child_process');
const apiResponse = require("../helpers/apiResponse");


const sentTempEmail =[async (req, res) => {
  try {
    const AWS = require('aws-sdk');

    // Configure the AWS SDK with your region
    AWS.config.update({ region: 'us-east-1' });
    
    // Create an instance of the STS service
    const sts = new AWS.STS();
    
    // Assume the IAM role in the SGP account (ums1-pool-ses)
    const assumeRoleParams = {
      RoleArn: 'arn:aws:iam::350027074327:role/ums1-pool-ses',
      RoleSessionName: 'AssumedRoleSession',
    };
    
    sts.assumeRole(assumeRoleParams, (err, data) => {
      if (err) {
        console.error('Error assuming role:', err);
        return;
      }
    
      // Configure AWS SDK with the temporary credentials from the assumed role
      const credentials = data.Credentials;
      const assumedRoleConfig = {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
      };
      const ses = new AWS.SES(assumedRoleConfig);
    
      // Construct the SES email parameters
      const params = {
        Destination: {
          ToAddresses: ['aamer@umstechlab.com'],
        },
        Message: {
          Body: {
            Text: { Data: 'Hello, this is a test email!' },
          },
          Subject: { Data: 'Test Email' },
        },
        Source: 'noreply@exotel.in',
      };
    
      // Send the email using SES
      ses.sendEmail(params, (err, data) => {
        if (err) {
          console.error('Error sending email:', err);
          return apiResponse.ErrorResponse(res, `Error sending email via AWS SDK =>  ${err}`);

        } else {
          console.log('Email sent successfully:', data);
          return apiResponse.successResponseWithData(res, 'Email sent successfully', data);
        }
      });
    });
} catch (error) {
    console.error("Error sending email:", error);
    return apiResponse.ErrorResponse(res, `Error sending email via catch Block => ${error}`);
}
}];

module.exports = {
    sentTempEmail
  };
  
