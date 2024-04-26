const User = require("../models/Users");
const Token = require("../models/Token");
const { body, query, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require("bcryptjs");
var jwt = require('jsonwebtoken');
const JWT_SECRET = "realEstateApp$ecret$493458395789";
const { Op } = require('sequelize');
var macaddress = require('macaddress');

const loginUser = [

    body("mobile")
        .isLength({ min: 10, max: 10 })
        .trim()
        .withMessage("Enter valid mobile number!")
        .custom((value) => {
            return User.findOne({
                where: { mobile: value },
            }).then((user) => {
                if (user == null) {
                    return Promise.reject("Please Enter Valid credentials");
                } else {

                }
            });
        }),

    body("password", "Enter valid password min 8 digits").isLength({
        min: 8,
        max: 100,
    }).trim(),
    async (req, res) => {
        const checkErrorInValidations = validationResult(req);
        if (!checkErrorInValidations.isEmpty()) {
            return res.status(400).json({
                result: false,
                message: "Please enter valid registered mobile number and valid password",
                errors: checkErrorInValidations.array(),
            });
        } else {
            try {
                const { mobile, password } = req.body;
                let user = await User.findOne({
                    where: {
                        mobile: mobile,
                        is_active: 1,
                        is_deleted: 0,
                        [Op.or]: [
                            { user_type: 1 },
                            { user_type: 2 }
                        ]
                    },
                });
                if(!user)
                {
                    return res.status(400).json({ result: false, message: 'User not found' });
                }        
                const passwordCompare = await bcrypt.compare(password, user.password);
                if (!passwordCompare) {
                    return res.status(400).json({ result: false, message: 'Please enter valid credentials' });
                } else {
                    var macaddressFinal ='';
                   await macaddress.one().then(function (mac) {
                        macaddressFinal = mac
                    });
                  
                    if(user.user_agent != null) {

                        if(user.mac != macaddressFinal) {
                            return res.status(400).json({ result: false, message: 'Please logout from another browser' });
                        } else {
                            user.user_agent = userAgent;
                            user.mac = macaddressFinal;
                            await user.save();
                           
                        }
                    } else {

                        // if(user.user_agent != userAgent && user.mac != macaddressFinal) {
                        if(user.mac != macaddressFinal) {
                            return res.status(400).json({ result: false, message: 'Please logout from another browser' });
                        } else {
                            user.user_agent = userAgent;
                            user.mac = macaddressFinal;
                            await user.save();
                            
                        }
                          
                    }
                   
                    if(passwordCompare && user.is_password_reset==1)
                    {
                        var isLessThan5Minutes=isTimeDifferenceGreaterThan5Minutes(new Date(user.updatedAt))
                        console.log(isLessThan5Minutes)
                        console.log(user.updatedAt)
                        if(isLessThan5Minutes){
                            const userId = user.id;
                            const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '3h' });
                            const expiration = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hour expiration                
                           // const createdTokenx = await Token.create({ userId, token, expiration });
                            // Find an existing token for the user or create a new one if it doesn't exist
                            const [createdToken, created] = await Token.findOrCreate({
                                where: { userId: userId },
                                defaults: { token: token, expiration: expiration }
                            });
                            // If token already exists, update it
                            if (!created) {
                                createdToken.token = token;
                                createdToken.expiration = expiration;
                                await createdToken.save();
                            }
                            return res.status(200).json({
                                result: true, message: 'User login successful', token: token, data: {
                                    id: user.id,
                                    name: user.name,                            
                                    email: user.email,
                                    mobile: user.mobile,
                                    user_type: user.user_type
                                }
                            });
                        }else{
                            return res.status(400).json({ result: false, message: 'Your temporary password is expired.' });
                        }
                    }else{
                        const userId = user.id;
                        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '3h' });
                        const expiration = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hour expiration                
                       // const createdTokenx = await Token.create({ userId, token, expiration });
                        // Find an existing token for the user or create a new one if it doesn't exist
                        const [createdToken, created] = await Token.findOrCreate({
                            where: { userId: userId },
                            defaults: { token: token, expiration: expiration }
                        });
                        // If token already exists, update it
                        if (!created) {
                            createdToken.token = token;
                            createdToken.expiration = expiration;
                            await createdToken.save();
                        }
                        return res.status(200).json({
                            result: true, message: 'User login successful', token: token, data: {
                                id: user.id,
                                name: user.name,                            
                                email: user.email,
                                mobile: user.mobile,
                                user_type: user.user_type
                            }
                        });
                    }

                    
                    
                }
            } catch (err) {
                console.log(err);
                res.status(500).send(err);        
            }
        }
    },
];
function isTimeDifferenceGreaterThan5Minutes(updatedAtFromDB) {
    // Convert updatedAt from MySQL to JavaScript Date object
    const updatedAt = new Date(updatedAtFromDB);

    // Get current time
    const currentTime = new Date();

    // Calculate time difference in milliseconds
    const timeDifference = currentTime.getTime() - updatedAt.getTime();

    // Check if time difference is greater than 5 minutes (300000 milliseconds)
    return timeDifference < (5 * 60 * 1000); // 5 minutes = 300000 milliseconds
}
module.exports = {
    loginUser,
};
