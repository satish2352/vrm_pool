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
const nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");
const { Op, fn, col ,literal} = require('sequelize'); // Importing Op, fn, and col from sequelize

const createTransporter=require('../config/nodemailerConfig');
const transporter=createTransporter();
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
      const adminId=req.user.id;

      const insertionPromises = usersToInsert.map(user => {        
        return User.build(user).validate()
          .then(() => {
            const match = /^(?:\+91|0|91)?([6-9]\d{9})$/.exec(user.mobile);
            user.mobile=match[1]
            return User.findOne({
              where: {            
                mobile: user.mobile
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
                user_type: 2,
                is_inserted: 0,
                reason: 'Mobile number  already exists',
                fileId: fileId,
                added_by:adminId
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
            console.error(`Validation error for user ${user.name}:`, validationError.message);
            const errorMessage = validationError.message.replaceAll('Validation error:', '').trim();

            const userCopyModel = ({
              name: user.name,              
              mobile: user.mobile,
              email: user.email,
              password:'12345678',   
              user_type: 2,
              is_inserted: 0,
              reason: errorMessage,
              fileId: fileId,
              added_by:adminId
            });
            usersNotInserted.push(userCopyModel);
            UsersCopy.create(userCopyModel);          
            return null; // Returning null so this user is not inserted
          });
      });
      Promise.all(insertionPromises)
        .then( async (usersToInsertFiltered) => {          
          const usersToInsertFinal = await Promise.all(usersToInsertFiltered.filter(user => user !== null)
          .map(async user => {
            const randomPassword = generateRandomPassword();
            const textpassword = randomPassword;
            const encryptedPassword = await hashPassword(randomPassword);
            console.log(encryptedPassword);
            console.log(textpassword);            
            return {
              name: user.name,
              mobile: user.mobile,
              email: user.email,
              password: encryptedPassword,
              user_type: 2,
              is_inserted: 1,
              reason: '',
              fileId: fileId,
              added_by: adminId,
              textpassword:textpassword,
            };
          }));
        
        // Now that usersToInsertFinal is fully populated, we can proceed with bulkCreate
        await UsersCopy.bulkCreate(usersToInsertFinal);
       return await User.bulkCreate(usersToInsertFinal);          
          
        }).then(async function(users) {
          console.log(`${users.length} users inserted successfully.`);
          usersInserted = users;          
          // Sending emails inside the async function
          for (const user of users) {
              try {
                  await transporter.sendMail({
                      from: 'vishvambhargore@sumagoinfotech.in',
                      to: user.email,
                      subject: 'Welcome to Our VRM POOL',
                      text: `Dear ${user.name},\nWelcome to our platform! Your account has been successfully created. your password is ${user.textpassword}`,
                  });
                  console.log(`Email sent to ${user.email}`);
                  console.log(`Password  ${user.textpassword}`);
              } catch (error) {
                  console.error(`Error sending email to ${user.email}:`, error);
              }
          }
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
                    return res.status(400).json({ result: false, message: 'No  record inserted' });
                }else{
                    console.log(usersInserted.length)
                    console.log(usersNotInserted.length)
                  if(usersInserted.length>0 && usersNotInserted.length>0)
                  {
                    return res.status(200).json({ result: true, message: 'File Processed Successfully ',inserted:usersInserted.length,notInserted:usersNotInserted.length});
                  }
                  if(usersNotInserted.length>0 && usersInserted.length==0){
                    return res.status(200).json({ result: false, message: 'File Processed Successfully ',inserted:usersInserted.length,notInserted:usersNotInserted.length});
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

  },
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
