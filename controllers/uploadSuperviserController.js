const User = require("../models/Users");
const UsersCopy = require("../models/UsersCopy");
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const verifyToken = require("../middleware/verifyToken");
const fs = require('fs');
const apiResponse = require("../helpers/apiResponse");
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const chmod = promisify(fs.chmod);
const folderPath = '../exports';
const excelJS = require("exceljs");
const workbookOfDownloadFile = new excelJS.Workbook();
const nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");
const { Op, fn, col, literal } = require('sequelize');
const AWS = require('aws-sdk');
const createTransporter = require('../config/nodemailerConfig');
const { error } = require("console");
const transporter = createTransporter();
let fileId;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {

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

const uploadSupervisers = [
  verifyToken,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ result: false, message: 'To upload file select valid file. only .xlsx or .xls file is allowed.' });
    }
    const workbook = xlsx.readFile(req.file.path);
    const sheets = workbook.SheetNames;
    let jsonData;
    var usersNotInserted = [];
    var usersInserted = [];

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
      const adminId = req.user.id;

      const insertionPromises = usersToInsert.map(user => {

        return User.build(user).validate()
        .then(() => {
          const match = /^(?:\+91|0|91)?(\d{10})$/.exec(user.mobile);
          user.mobile = match[1]
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
              user_type: 2,
              is_inserted: 0,
              reason: 'Mobile number already exists',
              fileId: fileId,
              added_by: adminId
            };
            usersNotInserted.push(userCopyModel);
            return UsersCopy.create(userCopyModel);
          } else {
            const randomPassword = generateRandomPassword();
            const textpassword = randomPassword;
            return hashPassword(randomPassword).then(encryptedPassword => {
              return User.create({
                name: user.name,
                mobile: user.mobile,
                email: user.email,
                password: encryptedPassword,
                user_type: 2,
                is_inserted: 1,
                reason: '',
                fileId: fileId,
                added_by: adminId,
                textpassword: textpassword
              }).then(async createdUser => {
                const userCopyModel = {
                  name: user.name,
                  mobile: user.mobile,
                  email: user.email,
                  password: '12345678',
                  user_type: 2,
                  is_inserted: 1,
                  reason: '',
                  fileId: fileId,
                  added_by: adminId,
                  textpassword: textpassword
                };              
                 
                  try {

                    AWS.config.update({ region: 'us-east-1' });
    
                    // Create an instance of the STS service
                    const sts = new AWS.STS();
                    
                    // Assume the IAM role in the SGP account (ums1-pool-ses)
                    const assumeRoleParams = {
                      RoleArn: 'arn:aws:iam::350027074327:role/ums1-pool-ses',
                      RoleSessionName: 'AssumedRoleSession',
                    };
                    
                    sts.assumeRole(assumeRoleParams, (err, data) => {
                        if (err) {
                          console.error('Error assuming role:', err);
                          return;
                        }
                      
                        // Configure AWS SDK with the temporary credentials from the assumed role
                        const credentials = data.Credentials;
                        const assumedRoleConfig = {
                          accessKeyId: credentials.AccessKeyId,
                          secretAccessKey: credentials.SecretAccessKey,
                          sessionToken: credentials.SessionToken,
                        };
                        const ses = new AWS.SES(assumedRoleConfig);
                      
                       
                        // Construct the SES email parameters
                        const params = {
                          Destination: {
                            ToAddresses: [`${user.email}`],
                          },
                          Message: {
                            Body: {
                              Text: { Data: `Dear Supervisor,\n\nYou have been added successfully to the VRM Pool Monitoring Dashboard.\n\nPlease find below your login credentials.\n\nusername: ${createdUser.mobile}\n\npassword: ${randomPassword}\n\nNote: Please change your password post login.\n` },
                            },
                            Subject: { Data: `Welcome to VRM Pool Monitoring Dashboard` },
                          },
                          Source: 'noreply@exotel.in',
                        };
                      
                        // Send the email using SES
                        ses.sendEmail(params, (err, data) => {
                          if (err) {
                            console.error('Error sending email:', err);
                            //return apiResponse.ErrorResponse(res, `Error sending email via AWS SDK =>  ${err}`);
                  
                          } else {
                            //return res.status(200).send({ result: true, message: "Temporary password successfully sent to registered email" });
                        }
                        });
                      });                
                } catch (error) {
                    console.error(`Error sending email to ${user.email}:`, error);
                    //return res.status(500).send({ result: false, message: `Error sending Temporary password email ${error}` });
                }
              
                usersInserted.push(userCopyModel);
                return UsersCopy.create(userCopyModel);
              });
            });
          }
        })
        .catch(validationError => {
          console.error(`Validation error for user ${user.name}:`, validationError.message);
          var errorMessage="";
          if (validationError.name === 'SequelizeValidationError' && validationError.errors.some(error => error.path === 'mobile')) {            
            errorMessage='Mobile number cannot be null.';
        } else if(validationError.name === 'SequelizeValidationError' && validationError.errors.some(error => error.path === 'name')) {
          errorMessage='Name cannot be null.';
            
        } else if(validationError.name === 'SequelizeValidationError' && validationError.errors.some(error => error.path === 'email')) {
          errorMessage='Email cannot be null.';          
        }
        else{
           errorMessage = validationError.message.replaceAll('Validation error:', '').trim();
        }
         // const errorMessage = validationError.message.replaceAll('Validation error:', '').trim();
          const userCopyModel = {
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            password: '12345678',
            user_type: 2,
            is_inserted: 0,
            reason: errorMessage,
            fileId: fileId,
            added_by: adminId
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
  ];

function generateRandomPassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  uploadSupervisers,
};
