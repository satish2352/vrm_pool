const User = require("../models/Users");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const resetPassword = [
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
                    }else
                    {
                        const { mobile } = req.body;
                        // Find the user in the database based on the provided mobile number
                        const user = await User.findOne({ where: { mobile } });
                        if (!user) {
                          return res.status(404).json({ result: true,message: "Enter valid credentials" });
                        }
                        // Generate a new random password
                        const newPassword = generateRandomPassword();                    
                        // Encrypt  the new password
                        const salt = await bcrypt.genSalt(10);
                        const encryptedPassword = await bcrypt.hash(newPassword, salt);                    
                        // Update the user's password in the database
                        user.set('password', encryptedPassword);
                        await user.save();
                        console.log(newPassword)
                        return res.status(200).send({ result: true, message: "Your password Reset Successfully Check your email" });
                    }                                       
            } catch (err) {
                console.log(err);
                res.status(500).send({result:false,err});        
            }       
    },
];
function generateRandomPassword() {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
  
module.exports = {
    resetPassword,
};
