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

const createTransporter = require('../config/nodemailerConfig');
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
  cb(new Error('Only Excel files are allowed'));
};

const upload = multer({ storage: storage, fileFilter: excelFilter });

const uploadSupervisers = [
  verifyToken,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return apiResponse.errorResponse(res, "To upload file select valid file. Only .xlsx or .xls files are allowed.", 400);
      }
      
      const workbook = xlsx.readFile(req.file.path);
      const sheets = workbook.SheetNames;
      let jsonData;
      let usersNotInserted = [];
      let usersInserted = [];

      for (const sheetName of sheets) {
        const worksheet = workbook.Sheets[sheetName];
        jsonData = xlsx.utils.sheet_to_json(worksheet);
        jsonData.forEach(data => data.sheetName = sheetName);
        if (jsonData.length < 1) {
          return apiResponse.errorResponse(res, "Excel file is empty or contains only a single row.", 400);
        }
      }

      let usersToInsert = jsonData;
      const adminId = req.user.id;

      const insertionPromises = usersToInsert.map(async user => {
        try {
          await User.build(user).validate();
          const match = /^(?:\+91|0|91)?([6-9]\d{9})$/.exec(user.mobile);
          user.mobile = match[1];
          const existingUser = await User.findOne({ where: { mobile: user.mobile } });
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
            await UsersCopy.create(userCopyModel);
          } else {
            const randomPassword = generateRandomPassword();
            const encryptedPassword = await hashPassword(randomPassword);
            const createdUser = await User.create({
              name: user.name,
              mobile: user.mobile,
              email: user.email,
              password: encryptedPassword,
              user_type: 2,
              is_inserted: 1,
              reason: '',
              fileId: fileId,
              added_by: adminId,
              textpassword: randomPassword
            });
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
              textpassword: 'randomPassword'
            };
            await transporter.sendMail({
              from: 'vishvambhargore@sumagoinfotech.in',
              to: createdUser.email,
              subject: 'Welcome to VRM Pool Monitoring Dashboard',
              text: `Dear Supervisor,\nYou have been added successfully to the VRM Pool Monitoring Dashboard.\nPlease find below your login credentials.\n              
              \nusername :${createdUser.mobile}\n
              \npassword :${createdUser.randomPassword}\n               
              Note: Please change your password post login.\n`,
            });          
            usersInserted.push(userCopyModel);
            await UsersCopy.create(userCopyModel);
          }
        } catch (error) {
          console.error(`Error processing user: ${error.message}`);
          let errorMessage;
          if (error.name === 'SequelizeValidationError' && error.errors.some(err => err.path === 'mobile')) {
            errorMessage = 'Mobile number cannot be null.';
          } else if (error.name === 'SequelizeValidationError' && error.errors.some(err => err.path === 'name')) {
            errorMessage = 'Name cannot be null.';
          } else if (error.name === 'SequelizeValidationError' && error.errors.some(err => err.path === 'email')) {
            errorMessage = 'Email cannot be null.';
          } else {
            errorMessage = error.message.replaceAll('Validation error:', '').trim();
          }
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
          await UsersCopy.create(userCopyModel);
        }
      });

      await Promise.all(insertionPromises);
      return apiResponse.successResponse(res, {
        message: 'File Processed Successfully',
        inserted: usersInserted.length,
        notInserted: usersNotInserted.length
      });
    } catch (error) {
      console.error(`Error processing users: ${error.message}`);
      return apiResponse.errorResponse(res, "Error occurred during operation", 500);
    } finally {
      // Clean up: Delete uploaded file after processing
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
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
