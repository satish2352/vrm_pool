const User = require("../models/Users");
const OTP = require("../models/OTP");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const createTransporter = require('../config/nodemailerConfig');
const transporter = createTransporter();
const AWS = require('aws-sdk');


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
                        if (req.body.mobile == user.mobile) {
                            const salt = await bcrypt.genSalt(10);
                            const encryptedPassword = await bcrypt.hash(randomPassword, salt)
                            user.set('password', encryptedPassword); // Admin Self password change            
                            user.set('is_password_reset', 1); // Set Password is Reset     
                            await user.save();       
                            //user.set('is_password_reset',1); // Admin Self password change 

                            // Configure the AWS SDK with your region
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
                                            Text: { Data: `Dear Supervisor,\n\n\n Your temporary password to reset your password is   ${randomPassword}  and it is valid for 5 minutes only.\n\nPlease use this temporary password and add a new password to your account.` },
                                        },
                                        Subject: { Data: 'Forgot Password - VRM Pool Monitoring Dashboard' },
                                    },
                                    Source: 'noreply@exotel.in',
                                };

                                // Send the email using SES
                                ses.sendEmail(params, (err, data) => {
                                    if (err) {
                                        console.error('Error sending email:', err);
                                        return res.status(500).send({ result: false, message: "Errror occured while resetting password" });

                                    } else {
                                        return res.status(200).send({ result: true, message: "User password reset successfully and sent via email" });
                                    }
                                });
                            });



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
            res.status(500).send({ result: false, message: "Error Ocurred During API Call", err });
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
