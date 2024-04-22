const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const Users = require("../models/Users");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const fs = require('fs');
const https = require('https');
const csv = require('csv-parser');
const { body, query, validationResult } = require("express-validator");

const getAgentCallDetails = [
  body('csv_url')
    .notEmpty().withMessage('CSV location url is required'),

  // Validate token
  body('token')
    .notEmpty().withMessage('Token is required')
    .isLength({ min: 30 }).withMessage('Token must be at least 30 characters long'),
  
    async (req, res) => {
        try {

          const authHeader = req.headers['authorization'];
          if (!authHeader) {
            return res.status(401).json({
              'result': false,
              'message': 'Authorization header missing'
            });
          }
    
          const authData = authHeader.split(' ');
          if (authData.length !== 2 || authData[0].toLowerCase() !== 'basic') {
            return res.status(401).json({
              'result': false,
              'message': 'Invalid Authorization header format'
            });
          }
    
          const credentials = Buffer.from(authData[1], 'base64').toString().split(':');
          const username = credentials[0];
          const password = credentials[1];
    
          // Check if username and password match expected values
          if (username !== 'vrmpooluser' || password !== 'joPFKoP&68$ii4j5') {
            return res.status(401).json({
              'result': false,
              'message': 'Invalid username or password'
            });
          }

          

          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            return res.status(400).json(
              {
              'result': false,
              'message': 'Validation Errors!',
              'errors':  errors.array() });
          }
        

          if(req.body.csv_url =='' || req.body.csv_url == null ) {
            apiResponse.ErrorResponse(res, 'Please provide file location url');
          }  else {
              await downloadAndReadCSV(req.body.csv_url);
              apiResponse.successResponse(res, 'CSV URL received successfully');
          }
        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];
const downloadFile = (url, destination) => {
    return new Promise((resolve, reject) => {
      try {
        const file = fs.createWriteStream(destination);
  
        https.get(url, response => {
          response.pipe(file);
  
          file.on('finish', () => {
            file.close(resolve(destination));
          });
        }).on('error', error => {
          fs.unlink(destination, () => {
            reject(error.message);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  };
  
  const readCSVFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const matchedResults = [];
        const promises = []; // Array to store promises for each findOne call
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                if (data.AgentPhoneNumber) {
                    // Push a promise for each findOne call into the promises array
                    const promise = Users.findOne({
                        where: { mobile: data.AgentPhoneNumber.slice(-10) },
                    }).then(user => {
                        if (user) {
                            data.user_id = user.id.toString();
                            data.AgentPhoneNumber = data.AgentPhoneNumber.slice(-10)
                            matchedResults.push(data);
                        }
                    }).catch(error => {
                        console.error('Error finding user:', error);
                    });
                    promises.push(promise);
                }
            })
            .on('end', () => {
                // Wait for all promises to resolve before resolving the main promise
                Promise.all(promises).then(() => {
                    console.log('CSV file processing complete.');
                    console.log(matchedResults.length);
                    resolve(matchedResults);
                }).catch(error => {
                    console.error('Error:', error);
                    reject(error);
                });
            })
            .on('error', (error) => {
                console.error('Error reading CSV file:', error);
                reject(error);
            });
    });
};
  const downloadAndReadCSV = async (url) => {
    const destination = './downloads/data.csv'; // Destination path to save the downloaded CSV file
    console.log("line 91",url)
    try {
      await downloadFile(url, destination);
      console.log('File downloaded successfully');
  
      const data = await readCSVFile(destination);
      console.log('CSV File contents: called', data);
      await insertDataToAgentData(data);
      
    } catch (error) {
      console.error('Error:downloadAndReadCSV', error);
    }
  };

  const insertDataToAgentData = async (data) => {

    console.log("insertDataToAgentData=========>");
    console.log(data.length);
    try {
      await AgentData.bulkCreate(data);
      console.log('Data inserted successfully into AgentData table');
      
    } catch (error) {
      console.error('Error:insertDataToAgentData', error);
    }
  };
module.exports = {
  getAgentCallDetails,
};
