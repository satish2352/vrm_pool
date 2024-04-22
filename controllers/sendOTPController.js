const User = require("../models/Users");
const OTP = require("../models/OTP");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const createTransporter = require('../config/nodemailerConfig');
const transporter = createTransporter();
const sendOTP = [
    body("mobile", "Enter valid mobile number").isLength({
        min: 10,
        max: 10,
    }).trim(),
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
                const { mobile } = req.body;

                // Find the user in the database based on the provided mobile number
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
                if (!user) {
                    return res.status(404).json({ result: false, message: "Enter valid credentials" });
                }

                // Check if user has sent OTP within the last 2 minutes
                const lastOTPSent = await OTP.findOne({
                    where: {
                        user_id: user.id,
                        updatedAt: {
                            [Sequelize.Op.gt]: Sequelize.literal('DATE_SUB(NOW(), INTERVAL 1 MINUTE)')
                        }
                    },
                    order: [['createdAt', 'DESC']]
                });
                
                // Check if user has sent OTP 5 times today
                const otpCountToday = await OTP.count({
                    where: {
                        user_id: user.id,
                        createdAt: {
                            [Sequelize.Op.gt]: Sequelize.literal('CURDATE()'),
                            [Sequelize.Op.lt]: Sequelize.literal('DATE_ADD(CURDATE(), INTERVAL 1 DAY)')
                        }
                    }
                });

                if (lastOTPSent || otpCountToday >= 5) {
                    return res.status(400).send({ result: false, message: "You can only send Temporary Password once every 1 minutes and up to 5 times per day" });
                }

                // Generate OTP and send email
                const otp = generateOTP();
                const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // Expiry time: 5 minutes from now

                // Save OTP to the database
                await OTP.create({
                    user_id: user.id,
                    otp: otp,
                    mobile: user.mobile,
                    expiry_time: expiryTime,
                    send_count: 0
                });

                // Send email with OTP
                try {
                    await transporter.sendMail({
                        from: 'vishvambhargore@sumagoinfotech.in',
                        to: user.email,
                        subject: 'Temporary password - VRM Pool Monitoring Dashboard',
                        text: `Your temporary password to reset your password is :${otp} and it is valid for 5 minutes only.
                        Please use this temporary password and add a new password to your account.`,
                    });
                    console.log(`Email sent to ${user.email}`);
                    return res.status(200).send({ result: true, message: "Temporary password successfully sent to registered email" });
                } catch (error) {
                    console.error(`Error sending email to ${user.email}:`, error);
                    return res.status(500).send({ result: false, message: "Error sending Temporary password email" });
                }
            }
        } catch (err) {
            console.log(err);
            res.status(500).send({ result: false, err });
        }
    },
];

function generateOTP() {
    // Generate a random buffer of 3 bytes (24 bits)
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^";
    let password = "";
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

module.exports = { sendOTP }
