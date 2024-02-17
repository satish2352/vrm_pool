const User = require("../models/Users");
const UsersCopy = require("../models/UsersCopy");
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
        cb(null, `${Date.now()}`);
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
        if (!req.file) {
            return res.status(400).json({ result: false, message: 'file not uploaded select valid file. only .xlsx or .xls file is allowed.' });
        }
        const workbook = xlsx.readFile(req.file.path);
        const sheets = workbook.SheetNames; // Get all sheet names    
        let jsonData;
        var usersNotInserted = [];
        try {
            for (const sheetName of sheets) {
                const worksheet = workbook.Sheets[sheetName];
                jsonData = xlsx.utils.sheet_to_json(worksheet);

                // Optional: Add sheet name as a property to each data object
                jsonData.forEach(data => data.sheetName = sheetName);

                // Alternatively, insert data sheet by sheet:
                // await collection.insertMany(jsonData);
            }

             let usersToInsert=jsonData;            

             const insertionPromises = usersToInsert.map(user => {
               return User.build(user).validate()
                 .then(() => {
                   // Validation passed for this user, check if mobile number already exists
                   return User.findOne({
                     where: { mobile: user.mobile }
                   });
                 })
                 .then(existingUser => {
                   if (existingUser) {
                     // User with the same mobile number already exists, add it to the list to log
                     usersNotInserted.push(user);            
                     const userCopyModel=({
                        fname:user.name,
                        mname:user.mname,
                        lname:user.lname,
                        mobile:user.mobile,
                        email:user.email,
                        password:user.password,
                        user_type:user.user_type,
                        is_inserted:0,
                        reason:'mobile number already exists'
                     });                
                     UsersCopy.create(userCopyModel);

                     return null; // Returning null so this user is not inserted
                   } else {
                     return user; // Returning the user object to be inserted
                   }
                 })
                 .catch(validationError => {
                   // Handle validation error for this user
                   console.error(`Validation error for user ${user.username}:`, validationError.message);
                   const userCopyModel=({
                    fname:user.name,
                    mname:user.mname,
                    lname:user.lname,
                    mobile:user.mobile,
                    email:user.email,
                    password:user.password,
                    user_type:user.user_type,
                    is_inserted:0,
                    reason:validationError.message
                 });                
                 UsersCopy.create(userCopyModel);
                   usersNotInserted.push(user);
                   return null; // Returning null so this user is not inserted
                 });
             });
             
             Promise.all(insertionPromises)
               .then(usersToInsertFiltered => {
                 // Filter out null entries (users not to be inserted)
                 const usersToInsertFinal = usersToInsertFiltered.filter(user => user !== null)
                 .map(user => ({user, fileId: 'your-file-id' }));                            
                 UsersCopy.bulkCreate(usersToInsertFinal);
                 return User.bulkCreate(usersToInsertFinal);
               })
               .then(users => {
                 console.log(`${users.length} users inserted successfully.`);
               })
               .catch(error => {
                 console.error('Error inserting users:', error.message);
               })
               .finally(() => {
                 if (usersNotInserted.length > 0) {
                   console.log(`Users not inserted (validation failed or already existing):`);                               
                 }
               });               

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error saving data' });
        } finally {
            //await client.close();
        }
        res.status(200).send({ result: true, message: 'File uploaded successfully','usersNotInseted':usersNotInserted.length});
    },
];

module.exports = {
    uploadUsers,
};
