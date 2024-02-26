const User = require("../models/Users");
const UsersCopy = require("../models/UsersCopy");
const multer = require('multer')
const path = require('path');
const xlsx = require('xlsx');
const verifyToken = require("../middleware/verifyToken");
const fs = require('fs'); // Require the 'fs' module for file operations
const apiResponse = require("../helpers/apiResponse");
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const chmod = promisify(fs.chmod);
const folderPath = '../exports';
const excelJS=require("exceljs")
const workbookOfDownloadFile = new excelJS.Workbook(); 
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
const excelFilter = function (req, file, cb) {
  const extname = path.extname(file.originalname).toLowerCase();
  if (extname === '.xlsx' || extname === '.xls') {
    return cb(null, true);
  }
  cb(null, false);

};

const upload = multer({ storage: storage, fileFilter: excelFilter });

const uploadSupervisers = [
  verifyToken,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ result: false, message: 'To upload file select valid file. only .xlsx or .xls file is allowed.' });
    }
    const workbook = xlsx.readFile(req.file.path);
    const sheets = workbook.SheetNames; // Get all sheet names    
    let jsonData;
    var usersNotInserted = [];
    var usersInserted = []; // New array to store inserted users

    try {
      for (const sheetName of sheets) {
        const worksheet = workbook.Sheets[sheetName];
        jsonData = xlsx.utils.sheet_to_json(worksheet);
        jsonData.forEach(data => data.sheetName = sheetName);
        if (jsonData.length < 1) {
          return res.status(400).json({ result: false, message: 'Excel file is empty or contains only a single row.' });
        }
      }

      let usersToInsert = jsonData;

      const insertionPromises = usersToInsert.map(user => {
        return User.build(user).validate()
          .then(() => {
            return User.findOne({
              where: { mobile: user.mobile }
            });
          })
          .then(existingUser => {
            if (existingUser) {
              const userCopyModel = ({
                fname: user.fname,
                mname: user.mname,
                lname: user.lname,
                mobile: user.mobile,
                email: user.email,
                password: user.password,
                user_type: 2,
                is_inserted: 0,
                reason: 'Mobile number already exists',
                fileId: fileId,
                added_by:0
              });
              usersNotInserted.push(userCopyModel)
              UsersCopy.create(userCopyModel);

              return null; // Returning null so this user is not inserted
            } else {
              return user; // Returning the user object to be inserted
            }
          })
          .catch(validationError => {
            // Handle validation error for this user
            console.error(`Validation error for user ${user.username}:`, validationError.message);
            const userCopyModel = ({
              fname: user.fname,
              mname: user.mname,
              lname: user.lname,
              mobile: user.mobile,
              email: user.email,
              password: user.password,
              user_type: 2,
              is_inserted: 0,
              reason: validationError.message,
              fileId: fileId,
              added_by:0
            });
            usersNotInserted.push(userCopyModel);
            UsersCopy.create(userCopyModel);
            // usersNotInserted.push(user);
            return null; // Returning null so this user is not inserted
          });
      });

      Promise.all(insertionPromises)
        .then(usersToInsertFiltered => {          
          // Filter out null entries (users not to be inserted)
          const usersToInsertFinal = usersToInsertFiltered.filter(user => user !== null)
            .map(user => ({
              fname: user.fname,
              mname: user.mname,
              lname: user.lname,
              mobile: user.mobile,
              email: user.email,
              password: user.password,
              user_type: 2,
              is_inserted: 1,
              reason: '',
              fileId: fileId,
              added_by:0
            }));
          UsersCopy.bulkCreate(usersToInsertFinal);
          return User.bulkCreate(usersToInsertFinal);
        })
        .then(users => {
          console.log(`${users.length} users inserted successfully.`);
          usersInserted = users;
        })
        .catch(error => {
          console.error('Error inserting users:', error.message);
        })
        .finally( () => {
          if (usersNotInserted.length > 0) {
            console.log(`Users not inserted (validation failed or already existing):`);
          }         
            UsersCopy.findAll({ where: { fileId: fileId } })
            .then(async userCopies => {
                if (userCopies.length === 0) {
                    return res.status(400).json({ result: false, message: 'All users exits already with matching data no record inserted' });
                }    
                // Prepare data for exporting to Excel
                const dataForExcel = userCopies.map(userCopy => ({
                    fname: userCopy.fname,
                    mname: userCopy.mname,
                    lname: userCopy.lname,
                    mobile: userCopy.mobile,
                    email: userCopy.email,
                    password: userCopy.password,
                    user_type: 2,
                    is_inserted: userCopy.is_inserted==1?"Yes":"No",
                    reason: userCopy.reason,
                    added_by:0
                    // Add other properties as needed
                }));
    

                fs.access(folderPath, fs.constants.F_OK, (err) => {
                  if (err) {
                      // Folder does not exist, create it and set permissions
                      mkdir(folderPath)
                          .then(() => {
                              console.log('${folderPath}');
                              // Setting permissions to 777 (read, write, execute for everyone)
                              return chmod(folderPath, 0o777);
                          })
                          .then(() => {
                              console.log("Permissions set for '${folderPath}'.");
                          })
                          .catch((error) => {
                              console.error("Error creating folder or setting permissions: ${error}");
                          });
                  } else {
                      console.log("Folder '${folderPath}' already exists.");
                  }
              });
               
              try {
                const worksheet = workbookOfDownloadFile.addWorksheet();
                // Fetch reports from the database
                //const reports = await Report.findAll({});
          
                // If no reports found, send a response with an appropriate message
                if (!dataForExcel.length) {
                    console.log("No reports found");
                    return apiResponse.successResponse(res, "No reports found", []);
                }
          
                // 'exotel_number', 'mobile', 'from_name', 'to_number', 'to_name', 'status', 'start_time', 'end_time', 'duration', 'price', 'recording_url', 'price_details', 'group_name', 'from_circle', 'to_circle', 'leg1_status', 'leg2_status', 'conversation_duration', 'app_id', 'app_name', 'digits', 'disconnected_by', 'fileId', 'createdAt', 'updatedAt'
          
               const selectedColumns = ['fname', 'mname', 'lname', 'mobile', 'email','password', 'user_type', 'is_inserted', 'reason'];
                // Get the column names dynamically from the first report object
                //const columnNames = Object.keys(dataForExcel[0].dataValues);
          
                 // Create columns dynamically based on the column names
                 const columns = selectedColumns.map(columnName => ({
                  header: columnName.replace(/\s+/g, ''), // Remove spaces from column name
                  key: columnName,
                  width: 20 // Set your preferred width here
              }));                    
                // Add columns to the worksheet
                worksheet.columns = columns;
          
                // Add data to the worksheet
                dataForExcel.forEach(report => {
                    const rowData = selectedColumns.map(columnName => report[columnName]);
                    worksheet.addRow(rowData);
                });
          
                // Write the workbook to the response object 
                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); 
                res.setHeader("Content-Disposition", `attachment; filename=${fileId}.xlsx`);
                await workbookOfDownloadFile.xlsx.write(res);
                res.send({result:true,message:"Report Exported Successfully"})
                res.end();
            } catch (error) {
                console.error("Error downloading file:", error);
                return apiResponse.ErrorResponse(res, "Error downloading file");
            }
                
            })
            .catch(error => {
                console.error('Error exporting data:', error.message);
                res.status(500).json({ result: false, message: 'Error exporting data.' });
            });
        });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error saving data' });
    } finally {
      //await client.close();
    }

  },
];
function ensureDirectoryExistence(filePath) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

module.exports = {
    uploadSupervisers,
};
