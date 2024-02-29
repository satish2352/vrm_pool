const verifyToken = require("../middleware/verifyToken");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");

const getUser = [

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
    verifyToken,
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
        const { mobile } = req.body;
        let userFilter = {
          
          mobile: mobile
        };
        
        let user = await User.findOne({
            where: { userFilter },
          });    
            return res.status(200).json({
                result: true, message: 'User fetch successful', data: {
                    id: user.id,
                    name:user.name,
                    fname: user.fname,
                    lname: user.lname,
                    email: user.email,
                    mobile: user.mobile,
                    user_type: user.user_type,
                    is_active:user.is_active
                }
            });
      } catch (err) {
        console.log(err);
        res.status(500).send(err);
      }
    }
  },
];



module.exports = {
    getUser,
};
