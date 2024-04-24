const User = require("../models/Users");
const OTP = require("../models/OTP");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { Op, fn, col ,literal,Sequelize} = require('sequelize');
const resetPassword = [
        body("mobile", "Enter valid mobile number").isLength({
            min: 10,
            max: 10,
          }).trim(),
          body("otp", "Enter valid temporary password sent to you via email").isLength({
            min: 10,
            max:10,            
          }).trim(),
          body("password", "Enter valid password min 8 digits maximum 30 digits").isLength({
            min: 8,
            max: 30,
        }),
        body("confirm_password", "Enter valid password min 8 digits maximum 30 digits").isLength({
            min: 8,
            max: 30,
        }).custom((value, { req }) => {
            // Check if confirm_password matches password field
            if (value !== req.body.password) {
                throw new Error("Passwords do not match");
            }
            return true;
        }),          
        async (req, res) => {
            try {
                const { mobile,password,otp } = req.body;
                const checkErrorInValidations = validationResult(req);
                if (!checkErrorInValidations.isEmpty()) {
                    return res.status(400).json({
                                result: false,
                                message: "Validation error",
                                errors: checkErrorInValidations.array(),
                            });
                    }else
                    {                                        
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
                          return res.status(404).json({ result: true,message: "Enter valid credentials" });
                        }else{
                        
                          var otpRecord=await verifyOTP(user.id,otp);
                            if(otpRecord){
                              const salt = await bcrypt.genSalt(10);
                              const encryptedPassword = await bcrypt.hash(password, salt);                    
                              // Update the user's password in the database
                              user.set('password', encryptedPassword);
                              await user.save(); 
                              await OTP.destroy({
                                where: {
                                 user_id:user.id
                                }
                              });                                 
                              return res.status(200).send({ result: true, message: "Your password reset Successfully" });
                            }else{
                              return res.status(200).send({ result: false, message: "Please enter valid temporary password" });
                            }
                           
                          }
                          
                        }                                                                
                                                           
            } catch (err) {
                console.log(err);
                res.status(500).send({result:false,err});        
            }       
    },
];
  async function verifyOTP(userId, otp) {
    const otpRecord = await OTP.findOne({
      where: {
        user_id: userId,       
        expiry_time: {
          [Sequelize.Op.gt]: new Date(), // Check if expiry_time > current time
        },        
      },
      order: [
        ['createdAt', 'DESC'], // Order by 'createdAt' in descending order
      ],
      limit: 1,
    });

   if (!otpRecord || otpRecord.otp !== otp) {
        return false;
    }

    // OTP record found and matches the provided OTP, return true
    return true; // If otpRecord is null, OTP is either invalid or expired
  }
  
module.exports = {resetPassword}
