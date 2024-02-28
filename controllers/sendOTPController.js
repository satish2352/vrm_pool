const User = require("../models/Users");
const OTP = require("../models/OTP");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op, fn, col ,literal} = require('sequelize');

const transporter = nodemailer.createTransport({
    host: "mail.sumagoinfotech.in",
    port: 465,
    secure: true,
    auth: {
        user: "vishvambhargore@sumagoinfotech.in",
        pass: "jfu6daky@#",
    },
});
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
                const user = await User.findOne({ where: { mobile } });
                if (!user) {
                    return res.status(404).json({ result: true, message: "Enter valid credentials" });
                }
                // Generate a new random password
                const otp = generateOTP();
                const expiryTime = new Date(Date.now() + 1 * 60 * 1000); // Expiry time: 5 minutes from now
                // Save OTP to the database
                const [otpRecord, created] = await OTP.findOrCreate({
                    where: { user_id: user.id },
                    defaults: {
                      otp:otp,
                      mobile:user.mobile,
                      expiry_time: expiryTime,
                    },
                  });
                
                  // If the OTP record was not created (i.e., it already existed), update it
                  if (!created) {
                    await otpRecord.update({
                      otp:otp,
                      mobile:user.mobile,
                      expiry_time: expiryTime,
                    });
                  }
                try {
                    await transporter.sendMail({
                        from: 'vishvambhargore@sumagoinfotech.in',
                        to: user.email,
                        subject: 'OTP for Resetting the password for your account with VRMPool ',
                        text: `Dear ${user.name},\nWelcome to our platform! Your can change your password using otp given below.Your otp is ${otp}`,
                    });
                    console.log(`Email sent to ${user.email}`);
                } catch (error) {
                    console.error(`Error sending email to ${user.email}:`, error);
                }
                return res.status(200).send({ result: true, message: "OTP Sent Successfully Check your email" });
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
