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
                fname: user.name,
                mname: user.mname,
                lname: user.lname,
                mobile: user.mobile,
                email: user.email,
                password: user.password,
                user_type: 2,
                is_inserted: 0,
                reason: 'Mobile number already exists',
                fileId: fileId
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
              fname: user.name,
              mname: user.mname,
              lname: user.lname,
              mobile: user.mobile,
              email: user.email,
              password: user.password,
              user_type: 2,
              is_inserted: 0,
              reason: validationError.message,
              fileId: fileId
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
              fname: user.name,
              mname: user.mname,
              lname: user.lname,
              mobile: user.mobile,
              email: user.email,
              password: user.password,
              user_type: 2,
              is_inserted: 1,
              reason: '',
              fileId: fileId
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
        .finally(() => {
          if (usersNotInserted.length > 0) {
            console.log(`Users not inserted (validation failed or already existing):`);
          }

          //res.status(200).send({ result: true, message: 'File uploaded successfully', usersInserted, usersNotInserted });
            // If the file has valid data, proceed with exporting UserCopy rows with matching fileId to Excel
            UsersCopy.findAll({ where: { fileId: fileId } })
            .then(userCopies => {
                if (userCopies.length === 0) {
                    return res.status(400).json({ result: false, message: 'No data found in UserCopy with matching fileId.' });
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
                    reason: userCopy.reason
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
                ensureDirectoryExistence('../expo');
                const filePath = path.join(__dirname, folderPath, `userCopy_${fileId}`);
                const ws = xlsx.utils.json_to_sheet(dataForExcel);
                const wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, "UserCopy Data");
                const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
                // Set headers and send the buffer as response
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=userCopy_${fileId}`); // Filename with fileId

                fs.writeFile(filePath, excelBuffer, (err) => {
                  if (err) {
                    console.error('Error writing Excel file:', err);
                    res.status(500).json({result:false, error: 'Error writing Excel file' });
                    return;
                  }                
                 
                  const relativeFilePath = path.relative(folderPath, filePath);                              
                  const myfilePath = './exports/userCopy_'+fileId;
                  console.log(myfilePath)
                  // Sending the file along with its path in the response
                  res.sendFile(path.resolve(myfilePath), (err) => {
                      if (err) {
                          console.error('Error sending file: ', err);
                          res.status(err.status).end();
                      } else {
                          console.log('File sent successfully');
                          
                      }
                  });
                  
                });
                

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
