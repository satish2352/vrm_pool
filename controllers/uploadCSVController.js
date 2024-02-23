const Report = require("../models/Report");
const Users = require("../models/Users");
const multer = require('multer')
const path = require('path');
const xlsx = require('xlsx');
const verifyToken = require("../middleware/verifyToken");
const fs = require('fs'); // Require the 'fs' module for file operations
const csv = require('csv-parser');


let fileId;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Generate a unique filename by adding a timestamp
    fileId = Date.now() + "_" + file.originalname
    //cb(null, `${Date.now()}_${file.originalname}}`);
    cb(null, fileId);
  }
});
const csvFileFilter = function (req, file, cb) {
  const extname = path.extname(file.originalname).toLowerCase();
  if (extname === '.csv') {
    return cb(null, true);
  }
  cb(null, false);

};

const upload = multer({ storage: storage, fileFilter: csvFileFilter });

const uploadData = [
  verifyToken,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ result: false, message: 'file not uploaded select valid csv file' });
    }
    try {
        const csvData = [];
        const filePath = req.file.path;    
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(csv())
          .on('data', async (row) => {

            await Users.findOne({ mobile: row.mobile })
            .then(user => {
              console.log('user:', user);
              if (user) {
                row.user_id = user.id.toString();
                console.log('user id:', user.id);
              }
              row.fileId = fileId;
              csvData.push(row);
              Report.create(row); // Perform bulk insertion
            })
            .catch(error => {
              console.error('Error finding user:', error);
              res.status(500).send({ result: false, message: 'Error finding user: ', error });
            });
              
          })
          .on('end', async () => {
            // Process and store parsed CSV data in the database
            try {
              if(csvData.length<1){
               return res.status(400).send({result:false,message:'No data found'});
              }
              console.log('csvData')                
              console.log(csvData)                
              await Report.bulkCreate(csvData); // Perform bulk insertion
              res.status(200).send({result:true,message:'CSV data stored successfully!'});
            } catch (error) {
              console.error('Error inserting reports:', error);
              res.status(500).send({result:false,message:'Error inserting reports! ',error});
            }
          })
          .on('error', (err) => {
            console.error('Error reading CSV file:', err);
            res.status(500).send({result:false,message:'Error reading CSV file: ',error});
          });
      } catch (error) {
        console.error('Error processing uploaded file:', error);
        res.status(500).send({result:false,message:'Error processing uploaded file:',error});
      } finally {
      }

  },
];

module.exports = {
    uploadData,
};

function isValidRow(row) {
  // Define required columns
  // const requiredColumns = ['id', 'direction', 'exotel_number', 'from_number', 'from_name', 'to_number', 'to_name', 'status', 'start_time', 'end_time', 'duration', 'price', 'recording_url', 'price_details', 'group_name', 'from_circle', 'to_circle', 'leg1_status', 'leg2_status', 'conversation_duration', 'app_id', 'app_name', 'digits', 'disconnected_by'];

  // // Check if all required columns are present in the row and have non-empty values
  // for (const column of requiredColumns) {
  //   if (!(column in row) || !row[column]) {
  //     return false; // Return false if any required column is missing or empty
  //   }
  // }

  return true; // Return true if all required columns are valid
}

