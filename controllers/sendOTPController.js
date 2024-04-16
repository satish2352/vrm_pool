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
                    return res.status(400).send({ result: false, message: "You can only send OTP once every 1 minutes and up to 5 times per day" });
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
                        subject: 'OTP for Resetting the password for your account with VRMPool ',
                        text: `Dear ${user.name},\nWelcome to our platform! Your can change your password using otp given below.Your otp is ${otp} is valid for 5 minutes`,
                    });
                    console.log(`Email sent to ${user.email}`);
                    return res.status(200).send({ result: true, message: "OTP Sent Successfully Check your email" });
                } catch (error) {
                    console.error(`Error sending email to ${user.email}:`, error);
                    return res.status(500).send({ result: false, message: "Error sending OTP email" });
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
    const otp = Math.floor(100000 + Math.random() * 900000);
    // Convert the number to a string and pad it with leading zeros to ensure 6 digits
    return otp.toString().padStart(6, '0');
}

module.exports = { sendOTP }
