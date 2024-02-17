const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const multer = require('multer')
const path = require('path');
const xlsx = require('xlsx');
const verifyToken = require("../middleware/verifyToken");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
    },
    filename: function (req, file, cb) {
        // Generate a unique filename by adding a timestamp
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const excelFilter = function (req, file, cb) {
    const extname = path.extname(file.originalname).toLowerCase();
    if (extname === '.xlsx' || extname === '.xls') {
        return cb(null, true);
    }
    // Create an error object in JSON format
    // const error = new Error('Invalid file. Only .xlsx or .xls files are allowed.');
    // error.status = 400;
    // Create an error object in JSON format
    const error = {
        message: 'Invalid file. Only .xlsx or .xls files are allowed.',
        status: 400
    };
    cb(null, false);

};

const upload = multer({ storage: storage, fileFilter: excelFilter });

const uploadUsers = [
    verifyToken,
    upload.single('file'),
    async (req, res) => {
        // req.body will hold the text fields, if there were any
        if (!req.file) {
            return res.status(400).json({ result: false, message: 'No files were uploaded select valid .xlsx or .xls files are allowed.' });
        }
        const workbook = xlsx.readFile(req.file.path);
        const sheets = workbook.SheetNames; // Get all sheet names
        const combinedData = [];
        let jsonData;
        let usersNotInserted = [];
        try {
            for (const sheetName of sheets) {
                const worksheet = workbook.Sheets[sheetName];
                jsonData = xlsx.utils.sheet_to_json(worksheet);

                // Optional: Add sheet name as a property to each data object
                jsonData.forEach(data => data.sheetName = sheetName);
                console.log(jsonData);

                // Alternatively, insert data sheet by sheet:
                // await collection.insertMany(jsonData);
            }

             let usersToInsert=jsonData;            
                const insertionPromises = usersToInsert.map(user => {
                return User.findOne({
                    where: { mobile: user.mobile }
                }).then(existingUser => {
                    if (existingUser) {
                    usersNotInserted.push(user);
                    return null; // Returning null so this user is not inserted
                    } else {
                    return user; // Returning the user object to be inserted
                    }
                });
                });

                Promise.all(insertionPromises)
                .then(usersToInsertFiltered => {
                    // Filter out null entries (users not to be inserted)
                    const usersToInsertFinal = usersToInsertFiltered.filter(user => user !== null);
                    return User.bulkCreate(usersToInsertFinal,{ validate: true ,ignoreDuplicates: true});
                })
                .then(users => {
                    console.log(`${users.length} users inserted successfully.`);
                })
                .catch(error => {
                    console.error('Error inserting users:', error.error);
                })
                .finally(() => {
                    if (usersNotInserted.length > 0) {
                    console.log(`Users not inserted (already existing):`);
                    console.log(usersNotInserted);
                    }
                });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error saving data' });
        } finally {
            //await client.close();
        }
        res.status(200).send({ result: true, message: 'File uploaded successfully', 'combinedData': jsonData,'usersNotInserted':usersNotInserted });
    },
];

module.exports = {
    uploadUsers,
};
