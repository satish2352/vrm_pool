const User = require("../models/Users");
const Token = require("../models/Token");
const { body, query, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require("bcryptjs");
var jwt = require('jsonwebtoken');
const JWT_SECRET = "realEstateApp$ecret$493458395789";

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
                message: "Validation error",
                errors: checkErrorInValidations.array(),
            });
        } else {
            try {
                const { mobile, password } = req.body;
                let user = await User.findOne({
                    where: { mobile: mobile },
                });
                const passwordCompare = await bcrypt.compare(password, user.password);
                if (!passwordCompare) {
                    return res.status(400).json({ result: false, message: 'Please enter valid credentials' });
                } else {
                    const userId = user.id;
                    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
                    const expiration = new Date(Date.now() + 3600000); // 1 hour expiration                
                    const createdToken = await Token.create({ userId, token, expiration });
                    console.log("hooooooooo");
                    console.log(createdToken);
                    return res.status(200).json({
                        result: true, message: 'User login successful', token: token, data: {
                            id: user.id,
                            fname: user.fname,
                            lname: user.lname,
                            email: user.email,
                            mobile: user.mobile,
                            user_type: user.user_type
                        }
                    });
                }
            } catch (err) {
                console.log(err);
                res.status(500).send(err);
            }
        }
    },
];

module.exports = {
    loginUser,
};
