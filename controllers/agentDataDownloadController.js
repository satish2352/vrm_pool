const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const AgentCallDetails = require("../models/AgentCallDetails");
const Users = require("../models/Users");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const fs = require('fs');
const https = require('https');
const csv = require('csv-parser');
const { body, query, validationResult } = require("express-validator");

const getAgentCallDetails = [
 
    async (req, res) => {
        try {
          const authHeader = req.headers['authorization'];

          if (!authHeader && (req.body.output_parameters.report_link =='' || req.body.output_parameters.report_link == null )) {
            return res.status(400).json({
              'result': false,
              'message': 'Bad Request '
            });
          }
    
          
          if (!authHeader) {
            return res.status(401).json({
              'result': false,
              'message': 'Invalid authentication details'
            });
          }
    
          const authData = authHeader.split(' ');
          if (authData.length !== 2 || authData[0].toLowerCase() !== 'basic') {
            return res.status(401).json({
              'result': false,
              'message': 'Invalid authentication details'
            });
          }
    
          const credentials = Buffer.from(authData[1], 'base64').toString().split(':');
          const username = credentials[0];
          const password = credentials[1];
    
          // Check if username and password match expected values
          if (username !== 'vrm_pool' || password !== 'ZX#HqZvs1@Zuvl9jvAhj&CTAxg2YhR==') {
            return res.status(401).json({
              'result': false,
              'message': 'Invalid authentication details'
            });
          }


          if(req.body.output_parameters.report_link =='' || req.body.output_parameters.report_link == null ) {
            // apiResponse.ErrorResponse(res, 'Please provide CSV file location url');
            return res.status(500).json({
              'status': 204,
              'message': 'Mandatory parameter missing'
            });
          }  else {
              await downloadAndReadCSV(req.body.output_parameters.report_link);
              return res.status(200).json({
                'status': 200,
                'message': 'Data received successfully'
              });
          }
        } catch (error) {
            console.error('Error fetching reports:', error);
            // apiResponse.ErrorResponse(res, "Error occurred during CSV processing ");
            return res.status(500).json({
              'status': 500,
              'message': 'Internal server error '
            });
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
  
  const readCSVFile = (filePath,url) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const matchedResults = [];
        const notMatchedResults = [];
        const promises = []; // Array to store promises for each findOne call
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                if (data.AgentPhoneNumber) {
                  var promise;
                    // Push a promise for each findOne call into the promises array
                    if (data.AgentPhoneNumber !== null && data.AgentPhoneNumber !== '') {
                       promise = Users.findOne({
                        where: { mobile: data.AgentPhoneNumber.slice(-10) },
                    }).then(user => {
                        if (user) {
                            data.user_id = user.id.toString();
                            data.AgentPhoneNumber = data.AgentPhoneNumber.slice(-10)
                            matchedResults.push(data);
                        }else{
                              
                          data.fileUrl=url;
                          data.message="Relationship Manager Not Found";
                          notMatchedResults.push(data)
                        
                        }
                    }).catch(error => {
                        console.error('Error finding user:', error);
                        data.fileUrl=url;
                        data.message="Error";
                        data.error=`${error}`;
                        notMatchedResults.push(data)
                    });
                      
                    }else{
                        data.fileUrl=url;
                         data.message="Error";
                         data.error=`Number is null or empty`;
                         data.AgentPhoneNumber="Number is null or empty"
                         notMatchedResults.push(data)
                    }
                    
                    promises.push(promise);
                }
            })
            .on('end', () => {
                // Wait for all promises to resolve before resolving the main promise
                Promise.all(promises).then(() => {
                    resolve([matchedResults,notMatchedResults]);
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
    try {
      await downloadFile(url, destination);
      const [data,notMatchedData] = await readCSVFile(destination,url);
      //await insertDataToAgentData(data);
      await insertDataToAgentDataInChunks(data,1000);
      console.log('--------------------------------------')
      console.log('--------------------------------------')
      console.log('--------------------------------------')
      console.log(notMatchedData.length)
      console.log('--------------------------------------')
      console.log('--------------------------------------')
      console.log('--------------------------------------')
      console.log('--------------------------------------')
      await insertNotMatchedDataInChunks(notMatchedData,1000)
    
    } catch (error) {
      console.error('Error:downloadAndReadCSV', error);
    }
  };

  const insertDataToAgentData = async (data) => {

    try {
      await AgentData.bulkCreate(data);
    } catch (error) {
      console.error('Error:insertDataToAgentData', error);
    }
  };



  const insertDataToAgentDataInChunks = async (data, chunkSize = 1000) => {
    // Helper function to chunk the data array
    const chunkArray = (array, chunkSize) => {
      const results = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        results.push(array.slice(i, i + chunkSize));
      }
      return results;
    };
  
    const chunks = chunkArray(data, chunkSize);
  
    // Process each chunk sequentially
    for (const chunk of chunks) {
      try {
        await AgentData.bulkCreate(chunk);
      } catch (error) {
        console.error('Error: insertDataToAgentData', error);
        // Optionally, handle retries or other error handling here
      }
    }
  };

  const insertNotMatchedDataInChunks = async (data, chunkSize = 1000) => {
    // Helper function to chunk the data array
    const chunkArray = (array, chunkSize) => {
      const results = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        results.push(array.slice(i, i + chunkSize));
      }
      return results;
    };
  
    const chunks = chunkArray(data, chunkSize);
  
    // Process each chunk sequentially
    for (const chunk of chunks) {
      try {
        await AgentCallDetails.bulkCreate(chunk);
      } catch (error) {
        console.error('Error: insertDataToAgentData', error);
        // Optionally, handle retries or other error handling here
      }
    }
  };

module.exports = {
  getAgentCallDetails,
};
