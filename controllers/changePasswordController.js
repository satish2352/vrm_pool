const User = require("../models/Users");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const changePassword = [
    body("password", "Enter valid password min 8 digits").isLength({
        min: 8,
        max: 100,
    }),
    body("old_password", "Enter valid password min 8 digits").isLength({
        min: 8,
        max: 100,
    }),
    body("confirm_password", "Enter valid password min 8 digits").isLength({
        min: 8,
        max: 100,
    }).custom((value, { req }) => {
        // Check if confirm_password matches password field
        if (value !== req.body.password) {
            throw new Error("Passwords do not match");
        }
        return true;
    }),
    body("id", "Enter valid id").isLength({
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
                let idTobeUpdated = req.body.id;
            

                    
                        let user = await User.findByPk(idTobeUpdated);
                        if (!user) {
                            return res.status(404).json({ result: false, message: "User not found" });
                        }
                        const passwordCompare = await bcrypt.compare(req.body.old_password, user.password);
                        if (!passwordCompare) {
                            return res.status(400).json({ result: false, message: 'Please enter valid old password' });
                        } else {
                            if(req.body.old_password==req.body.password)
                                {
                                    return res.status(400).json({ result: false, message: 'New password should be different than old password' });
                                }
                            if (req.body.id == req.user.id) {
                                const salt = await bcrypt.genSalt(10);
                                const encryptedPassword = await bcrypt.hash(req.body.password, salt)
                                req.user.set('password', encryptedPassword); // Admin Self password change
                                req.user.set('is_password_reset', 0); // Change it 0 when password reset
                                await req.user.save();
                                return res.status(200).send({ result: true, message: "Your password Changed Successfully" });
                            }else{
                                return res.status(400).send({ result: false, message: "You are not authorized to change password of this user" });
                            }
                        }
                        
            }
        } catch (err) {
            res.status(500).send({ result: false, err });
        }
    },
];

module.exports = {
    changePassword,
};
