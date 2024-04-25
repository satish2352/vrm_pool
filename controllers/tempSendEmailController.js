const AWS = require('aws-sdk');
const { exec } = require('child_process');
const apiResponse = require("../helpers/apiResponse");


// const sentTempEmail = [
//     async (req, res) => {
//       try {
//         // Configure the AWS SDK to automatically use IAM role credentials
// AWS.config.update({ region: 'ap-south-1' }); // Use Mumbai region
// AWS.config.credentials = new AWS.EC2MetadataCredentials();

// // Create a new SES object
// const ses = new AWS.SES();

// // Construct email parameters
// const params = {
//     Destination: {
//         ToAddresses: ['vugore@gmail.com']
//     },
//     Message: {
//         Body: {
//             Text: { Data: 'This is a test email' }
//         },
//         Subject: { Data: 'Test Email' }
//     },
//     Source: 'noreply@exotel.in' // Replace with your sender email address
// };

// // Method 1: Using AWS SDK to send email
// ses.sendEmail(params, (err, data) => {
//     if (err) {
//         console.log('Error sending email via AWS SDK:', err);
//         return apiResponse.ErrorResponse(res, `Error sending email via AWS SDK ${err}`);
//     } else {
//         console.log('Email sent successfully via AWS SDK:', data);
//         return  apiResponse.successResponseWithData(res, 'All details get successfully', reports);
//     }
// });
    
//       } catch (error) {
//         console.error("Error Sending Email ", error);
//         return apiResponse.ErrorResponse(res, "Error Sending Email");
//       }
//     },
//   ];

const sentTempEmail =[async (req, res) => {
  try {
    // Configure the AWS SDK with assumed role credentials
    const assumedRoleCredentials = await assumeRole();

    AWS.config.update({
        region: 'us-east-1', // Specify the desired region
        credentials: assumedRoleCredentials
    });

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
        Source: 'noreply@exotel.in' // Replace with your verified sender email address
    };

    // Send email
    ses.sendEmail(params, (err, data) => {
        if (err) {
            console.error('Error sending email via AWS SDK:', err);
            return apiResponse.ErrorResponse(res, `Error sending email via AWS SDK =>  ${err}`);
        } else {
            console.log('Email sent successfully via AWS SDK:', data);
            return apiResponse.successResponseWithData(res, 'Email sent successfully', data);
        }
    });
} catch (error) {
    console.error("Error sending email:", error);
    return apiResponse.ErrorResponse(res, `Error sending email via catch Block: ${err}`);
}
}];
// Function to assume IAM role
const assumeRole = async () => {
  const sts = new AWS.STS();
  const assumeRoleParams = {
      RoleArn: 'arn:aws:iam::350027074327:role/ums1-pool-ses',
      RoleSessionName: 'AssumedRoleSession'
  };
  const data = await sts.assumeRole(assumeRoleParams).promise();
  return new AWS.Credentials({
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken
  });
};

module.exports = {
    sentTempEmail
  };
  
