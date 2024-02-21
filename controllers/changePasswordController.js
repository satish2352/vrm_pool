const User = require("../models/Users");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const changePassword = [
    body("password", "Enter valid password min 8 digits").isLength({
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
                if (user_type) {
                    if (user_type == '1') {

                        let user = await User.findByPk(idTobeUpdated);
                        if (!user) {
                            return res.status(404).json({ result: false, message: "User not found" });
                        }
                        if (req.body.id == req.user.id) {
                            const salt = await bcrypt.genSalt(10);
                            const encryptedPassword = await bcrypt.hash(req.body.password, salt)
                            req.user.set('password', encryptedPassword); // Admin Self password change
                            await req.user.save();
                            return res.status(200).send({ result: true, message: "Your password Changed Successfully" });
                        }
                        if (user.user_type == '2' || user.user_type == '3') {
                            const salt = await bcrypt.genSalt(10);
                            const encryptedPassword = await bcrypt.hash(req.body.password, salt)
                            user.set('password', encryptedPassword); // Admin other users password change
                            await user.save();
                            return res.status(200).send({ result: true, message: "Users Password Changed Successfully" });
                        } else {
                            return res.status(400).send({ result: false, message: "Bad request you are not authorized" });
                        }

                    } else if (user_type == '2' || user_type == '3') {
                        const salt = await bcrypt.genSalt(10);
                        const encryptedPassword = await bcrypt.hash(req.body.password, salt)
                        req.user.set('password', encryptedPassword); // Users Self Password Change
                        await req.user.save();
                        return res.status(200).send({ result: true, message: "Your password Changed Successfully" });
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
    changePassword,
};
