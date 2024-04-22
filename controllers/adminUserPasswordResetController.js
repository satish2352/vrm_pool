const User = require("../models/Users");
const OTP = require("../models/OTP");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const createTransporter=require('../config/nodemailerConfig');
const transporter=createTransporter();


const resetUserPassword = [
    body("mobile", "Enter valid mobile").isLength({
        min: 1,
    }),
    verifyToken,
    async (req, res) => {
        try {
            const checkErrorInValidations = validationResult(req);
            if (!checkErrorInValidations.isEmpty()) {
                return res.status(400).json({
                    result: false,
                    message: "Validation error",
                    errors: checkErrorInValidations.array(),
                });
            } else {
                let user_type = req.user.user_type;
                let mobile = req.body.mobile;
                
                if (user_type) {
                    if (user_type == '1') {
                        const user = await User.findOne({ where: { mobile: mobile } });
                        const randomPassword = generateRandomPassword();  
                        if (!user) {
                            return res.status(404).json({ result: false, message: "User not found" });
                        }
                        if (req.body.mobile == user.mobile) 
                        {                                                                                                 
                            const salt = await bcrypt.genSalt(10);
                            const encryptedPassword = await bcrypt.hash(randomPassword, salt)
                            user.set('password', encryptedPassword); // Admin Self password change            
                            //user.set('is_password_reset',1); // Admin Self password change            
                            await user.save().then(async updatedUser=>{
                                try {
                                    await transporter.sendMail({
                                        from: 'vishvambhargore@sumagoinfotech.in',
                                        to: user.email,
                                        subject: `Forgot password - VRM Pool Monitoring Dashboard`,
                                        text: `Dear Supervisor,\n
                                        \n Your temporary password to reset your password is : ${randomPassword} and it is valid for 5 minutes only.
                                        
                                        \n Please use this temporary password and add a new password to your account.`,
                                    });
                                    console.log(`Email sent to ${user.email}`);
                                } catch (error) {
                                    console.error(`Error sending email to ${user.email}:`, error);
                                }
                            }).catch(error=>{
                                console.error(`Error occured during api call`, error);
                                return res.status(500).send({ result: false, message: "Errror occured while resetting password" });
                            });
                            return res.status(200).send({ result: true, message: "User password reset successfully and sent via email" });
                        }
                        else {
                            return res.status(400).send({ result: false, message: "Someting went wrong" });
                        }
                    } else {
                        return res.status(400).send({ result: false, message: "Bad request you are not authorized" });
                    }

                }
            }
        } catch (err) {
            console.log(err);
            res.status(500).send({ result: false, message:"Error Ocurred During API Call",err });
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
module.exports = {
    resetUserPassword,
};
