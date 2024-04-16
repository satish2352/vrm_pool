const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const Users = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const fs = require('fs');
const https = require('https');
const csv = require('csv-parser');

const downloadAgentData = [
    async (req, res) => {
        try {
            const { user_type, fromdate, todate, status,  supervisor_id,agent_id,direction ,fromtime,totime} = req.body;

            downloadAndReadCSV();

           // setInterval(downloadAndReadCSV, 1 * 60 * 1000); // 1 minutes in milliseconds

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
  const downloadAndReadCSV = async () => {
    const url = 'https://s3-ap-south-1.amazonaws.com/exotelreports-mum1/icicibank100m/1558f7e185c555de51522ce5806d993d.csv'; // URL of the CSV file to download
    const destination = './downloads/data.csv'; // Destination path to save the downloaded CSV file
  
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
  downloadAgentData,
};
