const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const NotFoundAgentCallDetails = require("../models/NotFoundAgentCallDetails");
const Users = require("../models/Users");
const { Op, fn, col, literal } = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const fs = require('fs');
const https = require('https');
const csv = require('csv-parser');
const { body, query, validationResult } = require("express-validator");
const logger = require('./logger'); // Import logger

const getAgentCallDetails = [

  async (req, res) => {
    try {
      logger.info('Request received for getAgentCallDetails'); // Example log
      const authHeader = req.headers['authorization'];

      // if (!authHeader && (req.body.UploadLocation == '' || req.body.UploadLocation == null)) {
      //   return res.status(400).json({
      //     'result': false,
      //     'message': 'Bad Request '
      //   });
      // }

      if (req.body.UploadLocation == '' || req.body.UploadLocation == null) {
        logger.info('Bad Request',req); // Example log
        return res.status(400).json({
          'result': false,
          'message': 'Bad Request '
        });
      }


      // if (!authHeader) {
      //   return res.status(401).json({
      //     'result': false,
      //     'message': 'Invalid authentication details'
      //   });
      // }

      // const authData = authHeader.split(' ');
      // if (authData.length !== 2 || authData[0].toLowerCase() !== 'basic') {
      //   return res.status(401).json({
      //     'result': false,
      //     'message': 'Invalid authentication details'
      //   });
      // }

      // const credentials = Buffer.from(authData[1], 'base64').toString().split(':');
      // const username = credentials[0];
      // const password = credentials[1];

      // Check if username and password match expected values
      // if (username !== 'vrm_pool' || password !== 'ZX#HqZvs1@Zuvl9jvAhj&CTAxg2YhR==') {
      //   return res.status(401).json({
      //     'result': false,
      //     'message': 'Invalid authentication details'
      //   });
      // }


      if (req.body.UploadLocation == '' || req.body.UploadLocation == null) {
        // apiResponse.ErrorResponse(res, 'Please provide CSV file location url');
        logger.info('Mandatory parameter missing'); // Example log
        return res.status(500).json({
          'status': 204,
          'message': 'Mandatory parameter missing'
        });
      } else {
        logger.info(`File Download Started. => ${req.body.UploadLocation}`); // Example log
        await downloadAndReadCSV(req.body.UploadLocation);
        return res.status(200).json({
          'status': 200,
          'message': 'Data received successfully'
        });
      }
    } catch (error) {
      logger.error('Error in getAgentCallDetails:', error); //
      console.error('Error fetching reports:', error);
      // apiResponse.ErrorResponse(res, "Error occurred during CSV processing ");
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error '
      });
    }
  },
];
const retryDownloadFile = async (url, destination, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
      try {
          await downloadFile(url, destination);
          return; // If successful, exit the function
      } catch (error) {
          if (attempt < retries) {
              logger.warn(`Attempt ${attempt} failed. Retrying...`);
          } else {
              logger.error('All download attempts failed');
              throw error; // Throw the error if all attempts fail
          }
      }
  }
};
const downloadFile = (url, destination) => {
  return new Promise((resolve, reject) => {
    try {
      const file = fs.createWriteStream(destination);

      https.get(url, response => {
        if (response.statusCode !== 200) {
          // Handle non-200 errors by rejecting the promise to trigger retry
          const error = new Error(`Request Failed. Status Code: ${response.statusCode}`);
          logger.error(`Error downloading file: ${error.message}`); // Example log
          logger.error(`Error downloading file: ${url}`); // Example log
          fs.unlink(destination, () => reject(error.message));
          return;
       }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve(destination));
          logger.info(`File Download Completed. => ${url}`);
        });
      }).on('error', error => {
        logger.error(`Error downloading file =>  ${url}`); // Example log
        fs.unlink(destination, () => {
          reject(error.message);
        });
      });
    } catch (error) {
      logger.error(`Error downloading file =>  ${url}`); // Example log
      reject(error);
    }
  });
};

const readCSVFile = (filePath, url) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const matchedResults = [];
    const notMatchedResults = [];
    const promises = []; // Array to store promises for each findOne call
    logger.info('File reading started '); // Example log
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
       
        if (data && data.AgentPhoneNumber){
          var promise;
          promise = Users.findOne({
            attributes: ['id'],
            where: { 
              mobile: data.AgentPhoneNumber.slice(-10),
              user_type:3,
             },
          }).then(user => {
            if (user) {
              data.user_id = user.id.toString();
              data.AgentPhoneNumber = data.AgentPhoneNumber.slice(-10)
              data.DeviceOnHumanReadableInSeconds=convertTimeToSeconds(data.DeviceOnHumanReadable);
              matchedResults.push(data);
            } 
            else 
            {
              data.fileUrl = url;
              data.message = "Relationship Manager Not Found";
              notMatchedResults.push(data)
            }
          }).catch(error => {
            logger.info('Error finding user',error); // Example log          
            console.error('Error finding user:', error);
            data.fileUrl = url;
            data.message = "Error";
            data.error = `${error}`;
            notMatchedResults.push(data)
          });
        }else if(!data.AgentPhoneNumber) {
          
          data.fileUrl = url;
          data.message = "Number Not Found";
          data.error = '';      
          notMatchedResults.push(data)
        }
        promises.push(promise);
      })
      .on('end', () => {
        // Wait for all promises to resolve before resolving the main promise
        Promise.all(promises).then(() => {
          
          logger.info("Relationship Manager Matched Records =>", { data: matchedResults }); // Example log
          logger.error("Relationship Manager Not Matched Records =>", { data: notMatchedResults }); // Example log

          resolve([matchedResults, notMatchedResults]);
        }).catch(error => {
          console.error('Error:', error);
          logger.error("Error resolving all promises =>", { data: error }); // Example log

          reject(error);
        });
      })
      .on('error', (error) => {
        logger.error("Error reading CSV file =>", { data: error }); // Example log
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
};
const downloadAndReadCSV = async (url) => {
  const destination = './downloads/data.csv'; // Destination path to save the downloaded CSV file
  try {
    //await downloadFile(url, destination);
    await retryDownloadFile(url, destination, 1);
    const [data, notMatchedData] = await readCSVFile(destination, url);
    //await insertDataToAgentData(data);
    await insertDataToAgentDataInChunks(data, 1000);
    await insertNotMatchedDataInChunks(notMatchedData, 1000)

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
      await NotFoundAgentCallDetails.bulkCreate(chunk);
    } catch (error) {
      console.error('Error: insertDataToAgentData', error);
      // Optionally, handle retries or other error handling here
    }
  }
};

function convertTimeToSeconds(timeString) {
  let hours = 0, minutes = 0, seconds = 0;
  
  // Use regular expressions to find hours, minutes, and seconds
  const hoursMatch = timeString.match(/(\d+)\s*Hours?/i);
  const minutesMatch = timeString.match(/(\d+)\s*Minutes?/i);
  const secondsMatch = timeString.match(/(\d+)\s*Seconds?/i);
  
  // Parse hours, minutes, and seconds if matches are found
  if (hoursMatch) {
      hours = parseInt(hoursMatch[1]);
  }
  if (minutesMatch) {
      minutes = parseInt(minutesMatch[1]);
  }
  if (secondsMatch) {
      seconds = parseInt(secondsMatch[1]);
  }
  
  // Calculate total seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  return totalSeconds;
  
}

module.exports = {
  getAgentCallDetails,
};
