const User = require("../models/Users");
const UsersCopy = require("../models/UsersCopy");
const multer = require('multer')
const path = require('path');
const xlsx = require('xlsx');
const verifyToken = require("../middleware/verifyToken");
const apiResponse = require("../helpers/apiResponse");
const { body, query, validationResult } = require("express-validator");


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



const uploadAgents = [
  verifyToken,
  upload.single('file'),
  body("superviserId", "Enter valid superviserId").isLength({ min: 1 }),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ result: false, message: 'To upload file select valid file. only .xlsx or .xls file is allowed.' });
    }
    const checkErrorInValidations = validationResult(req);
    if (!checkErrorInValidations.isEmpty()) {
      return res.status(400).json({
        result: false,
        message: "Validation error",
        errors: checkErrorInValidations.array(),
      });
    }else{
      let superviserId=req.body.superviserId;

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
              where: {
                [Op.or]: [
                  { mobile: user.mobile },
                  { email: user.email }
                ]
              }
            });
          })
          .then(existingUser => {
            if (existingUser) {
              const userCopyModel = ({
                name: user.name,              
                mobile: user.mobile,
                email: user.email,
                password:'12345678',              
                user_type: 3,
                is_inserted: 0,
                reason: 'Mobile number already exists',
                fileId: fileId,
                added_by:superviserId
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
              name: user.name,              
              mobile: user.mobile,
              email: user.email,
              password:'12345678',   
              user_type: 3,
              is_inserted: 0,
              reason: validationError.message,
              fileId: fileId,
              added_by:superviserId
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
              name: user.name,              
              mobile: user.mobile,
              email: user.email,   
              password: '12345678',
              user_type: 3,
              is_inserted: 1,
              reason: '',
              fileId: fileId,
              added_by:superviserId
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
                }else{
                    
                  if(usersInserted.length>0 && usersNotInserted.length>0)
                  {
                    return res.status(200).json({ result: true, message: 'File Processed Successfully ',inserted:usersInserted.length,notInserted:usersNotInserted.length});
                  }
                  if(usersNotInserted.length==0 && usersInserted.length>0){
                    return res.status(200).json({ result: true, message: 'File Processed Successfully ',inserted:usersInserted.length,notInserted:usersNotInserted.length});
                  }
                  return res.status(200).json({ result: true, message: 'File Processed Successfully ',inserted:usersInserted.length,notInserted:usersNotInserted.length});
                }                   
            })
            .catch(error => {              
                res.status(500).json({ result: false, message: 'Error occured during operation',error});
            });
        });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error saving data' });
    } finally {
      
    }
  }
  },
];


module.exports = {
    uploadAgents,
};
