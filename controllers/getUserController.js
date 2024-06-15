const verifyToken = require("../middleware/verifyToken");
const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");

const getUser = [
  verifyToken,
  body('id').isLength({ min: 1 }).withMessage('Id parameter must have a minimum length of 1')
  ,
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
           const { id } = req.body;                         
           const user = await User.findOne({ where: { id: id } });
           if (!user) {
            return res.status(404).json({ result: false, message: "User not found" });
        }   
            return res.status(200).json({
                result: true, message: 'User fetch successful', data: {
                    id: user.id,
                    name:user.name,                    
                    email: user.email,
                    mobile: user.mobile,
                    user_type: user.user_type,
                    is_active:user.is_active
                }
            });
      } catch (err) {
        res.status(500).send(err);
      }
    }
  },
];



module.exports = {
    getUser,
};
