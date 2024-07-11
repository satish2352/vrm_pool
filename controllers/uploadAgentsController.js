const User = require("../models/Users");
const UsersCopy = require("../models/UsersCopy");
const multer = require('multer')
const path = require('path');
const xlsx = require('xlsx');
const verifyToken = require("../middleware/verifyToken");
const apiResponse = require("../helpers/apiResponse");
const { Op, fn, col, literal } = require('sequelize'); // Importing Op, fn, and col from sequelize
const { body, query, validationResult } = require("express-validator");


let fileId;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Generate a unique filename by adding a timestamp

    const sanitizedFilename = file.originalname.replace(/[^\w\s.]/gi, "").replace(/\s+/g, "").trim();

    fileId = Date.now() + "_" + sanitizedFilename;
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
    } else {
      let superviserId = req.body.superviserId;

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
          }else{
          }
        }

        let usersToInsert = jsonData;

        const insertionPromises = usersToInsert.map(user => {

          return User.build(user).validate()
          .then(() => {
            const match = /^(?:\+91|0|91)?(\d{10})$/.exec(user.mobile);
            user.mobile = match[1]
          return User.findOne({
            where: {
              mobile: user.mobile
            }
          })})
          .then(existingUser => {
            if (existingUser) {
              const userCopyModel = {
                name: user.name,
                mobile: user.mobile,
                email: user.email,
                password: '12345678',
                user_type: 3,
                is_inserted: 0,
                reason: 'Mobile number already exists',
                fileId: fileId,
                added_by: superviserId
              };
              usersNotInserted.push(userCopyModel);
              return UsersCopy.create(userCopyModel);
            } else {
             
              return User.create({
                  name: user.name,
                  mobile: user.mobile,
                  email: user.email,
                  password: 'encryptedPassword',
                  user_type: 3,
                  is_inserted: 1,
                  reason: '',
                  fileId: fileId,
                  added_by: superviserId,                  
                }).then(async creatuseredUser => {
                  const userCopyModel = {
                    name: creatuseredUser.name,
                    mobile: creatuseredUser.mobile,
                    email: creatuseredUser.email,
                    password: '12345678',
                    user_type: 3,
                    is_inserted: 1,
                    reason: '',
                    fileId: fileId,
                    added_by: superviserId,                  
                  };                                                
                  usersInserted.push(userCopyModel);
                  return UsersCopy.create(userCopyModel);
                });
          
            }
          })
          .catch(validationError => {
            console.error(`Validation error for user ${user.name}:`, validationError.message);
            var errorMessage="";
            if (validationError.name === 'SequelizeValidationError' && validationError.errors.some(error => error.path === 'mobile')) {            
              errorMessage='Mobile number cannot be null.';
          } else if(validationError.name === 'SequelizeValidationError' && validationError.errors.some(error => error.path === 'name')) {
            errorMessage=validationError.message;
              
          } else if(validationError.name === 'SequelizeValidationError' && validationError.errors.some(error => error.path === 'email')) {
            errorMessage='Email cannot be null.';          
          }
          else{
             errorMessage = validationError.message.replaceAll('Validation error:', '').trim();
          }
            const userCopyModel = {
              name: user.name,
              mobile: user.mobile,
              email: user.email,
              password: '12345678',
              user_type: 3,
              is_inserted: 0,
              reason: errorMessage,
              fileId: fileId,
              added_by: superviserId
            };
            usersNotInserted.push(userCopyModel);
            return UsersCopy.create(userCopyModel);
          });
        });
        Promise.all(insertionPromises)
          .then(() => {
            res.status(200).json({
              result: true,
              message: 'File Processed Successfully ',
              inserted: usersInserted.length,
              notInserted: usersNotInserted.length
            });
          })
          .catch(error => {
            console.error('Error inserting users:', error.message);
            res.status(500).json({
              result: false,
              message: 'Error occurred during operation',
              error: error.message
            });
          });
      }catch(error){
        console.error('Error inserting users:', error.message);
        res.status(500).json({
          result: false,
          message: 'Error occurred during operation',
          error
        });
      }
    }
  }
  ];


module.exports = {
  uploadAgents,
};
