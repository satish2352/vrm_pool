const User = require("../models/Users");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const updateUser = [
    verifyToken,
    body("id"),
    body("mobile")
        .optional()
        .isLength({ min: 10, max: 10 })
        .trim()
        .withMessage("Enter valid mobile number")
        .custom(async (value, { req }) => {
            if (value) {
                const existingUser = await User.findOne({
                    where: { mobile: value },
                });
                if (existingUser && existingUser.id !== req.user.id) {
                    return Promise.reject("Mobile number already exists");
                }
            }
        }),
    body("email")
        .optional()
        .isEmail()
        .trim()
        .withMessage("Enter valid email id")
        .custom(async (value, { req }) => {
            if (value) {
                const existingUser = await User.findOne({
                    where: { email: value },
                });
                if (existingUser && existingUser.id !== req.user.id) {
                    return Promise.reject("Email already exists");
                }
            }
        }),
    body("name")
        .optional().custom(value=>{
            if (value.length < 5) {
                throw new Error('Please Enter Full Name');
              }else{
                return true;
              }

        })
       ,
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
                let idTobeUpdated = req.body.id;
                if (user_type) {
                    if (user_type == '1') {
                        let user = await User.findByPk(idTobeUpdated);
                        if (!user) {
                            return res.status(404).json({ result: false, message: "User not found" });
                        }
                        // Assuming the password update functionality remains unchanged here...

                        // Update user details
                        const updatedFields = {};
                        if (req.body.mobile && req.body.mobile !== user.mobile) updatedFields.mobile = req.body.mobile;
                        if (req.body.email && req.body.email !== user.email) updatedFields.email = req.body.email;
                        if (req.body.name) updatedFields.name = req.body.name;

                        if (Object.keys(updatedFields).length === 0) {
                            return res.status(400).json({ result: false, message: "No fields to update provided" });
                        }

                        await user.update(updatedFields);

                        return res.status(200).send({ result: true, message: "User details updated successfully" });
                    } else {
                        return res.status(400).send({ result: false, message: "Bad request you are not authorized" });
                    }
                }
            }
        } catch (err) {
            console.log(err);
            res.status(500).send({ result: false, err });
        }
    },
];

module.exports = {
    updateUser,
};
