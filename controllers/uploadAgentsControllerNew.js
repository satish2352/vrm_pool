const User = require("../models/Users");
const UsersCopy = require("../models/UsersCopy");
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const verifyToken = require("../middleware/verifyToken");
const { body, validationResult } = require("express-validator");

let fileId;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
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

const BATCH_SIZE = 1000; // Adjust batch size as needed

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
    }

    const superviserId = req.body.superviserId;
    const workbook = xlsx.readFile(req.file.path);
    const sheets = workbook.SheetNames;

    let usersNotInserted = [];
    let usersInserted = [];
    let batchInsertPromises = [];

    try {
      for (const sheetName of sheets) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        jsonData.forEach(data => data.sheetName = sheetName);

        if (jsonData.length < 1) {
          return res.status(400).json({ result: false, message: 'Excel file is empty or contains only a single row.' });
        }

        for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
          const batch = jsonData.slice(i, i + BATCH_SIZE);
          const batchPromise = processBatch(batch, superviserId, usersInserted, usersNotInserted);
          batchInsertPromises.push(batchPromise);

          if (batchInsertPromises.length >= 5) {
            await Promise.all(batchInsertPromises);
            batchInsertPromises = [];
          }
        }
      }

      await Promise.all(batchInsertPromises);

      res.status(200).json({
        result: true,
        message: 'File Processed Successfully',
        inserted: usersInserted.length,
        notInserted: usersNotInserted.length
      });

    } catch (error) {
      console.error('Error inserting users:', error.message);
      res.status(500).json({
        result: false,
        message: 'Error occurred during operation',
        error: error.message
      });
    }
  }
];

async function processBatch(batch, superviserId, usersInserted, usersNotInserted) {
  const insertionPromises = batch.map(user => {
    return User.build(user).validate()
      .then(() => {
        const match = /^(?:\+91|0|91)?([6-9]\d{9})$/.exec(user.mobile);
        if (match) user.mobile = match[1];
        return User.findOne({ where: { mobile: user.mobile } });
      })
      .then(existingUser => {
        if (existingUser) {
          const userCopyModel = createUserCopyModel(user, 0, 'Mobile number already exists', superviserId);
          usersNotInserted.push(userCopyModel);
          return UsersCopy.create(userCopyModel);
        } else {
          return User.create(createUserModel(user, superviserId))
            .then(createdUser => {
              const userCopyModel = createUserCopyModel(createdUser, 1, '', superviserId);
              usersInserted.push(userCopyModel);
              return UsersCopy.create(userCopyModel);
            });
        }
      })
      .catch(validationError => handleValidationError(validationError, user, usersNotInserted, superviserId));
  });

  return Promise.all(insertionPromises);
}

function createUserModel(user, superviserId) {
  return {
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    password: 'encryptedPassword',
    user_type: 3,
    is_inserted: 1,
    reason: '',
    fileId: fileId,
    added_by: superviserId,
  };
}

function createUserCopyModel(user, isInserted, reason, superviserId) {
  return {
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    password: '12345678',
    user_type: 3,
    is_inserted: isInserted,
    reason: reason,
    fileId: fileId,
    added_by: superviserId,
  };
}

function handleValidationError(validationError, user, usersNotInserted, superviserId) {
  console.error(`Validation error for user ${user.name}:`, validationError.message);
  let errorMessage = "";
  if (validationError.name === 'SequelizeValidationError') {
    const errorField = validationError.errors[0].path;
    switch (errorField) {
      case 'mobile':
        errorMessage = 'Mobile number cannot be null.';
        break;
      case 'name':
        errorMessage = 'Name cannot be null.';
        break;
      case 'email':
        errorMessage = 'Email cannot be null.';
        break;
      default:
        errorMessage = validationError.message.replaceAll('Validation error:', '').trim();
        errorMessage = validationError.message;

    }
  } else {
    errorMessage = validationError.message.replaceAll('Validation error:', '').trim();
    errorMessage = validationError.message;
  }
  const userCopyModel = createUserCopyModel(user, 0, errorMessage, superviserId);
  usersNotInserted.push(userCopyModel);
  return UsersCopy.create(userCopyModel);
}

module.exports = {
  uploadAgents,
};
