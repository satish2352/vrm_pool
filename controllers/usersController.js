const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require("bcryptjs");

const addusers = [
  // body("email", "Enter valid email id").isEmail(),
  body("fname", "Enter valid first name min 2 characters").isLength({
    min: 2,
    max: 100,
  }),
  body("mname", "Enter valid middle name min 2 characters").isLength({
    min: 2,
    max: 100,
  }),
  body("lname", "Enter valid last name min 2 characters").isLength({
    min: 2,
    max: 100,
  }),
  // body("mobile", "Enter valid mobile number").isLength({ min: 10, max: 10 }),

  body("mobile")
    .isLength({ min: 10, max: 10 })
    .trim()
    .withMessage("Enter valid mobile number!")
    .custom((value) => {
      return User.findOne({
        where: { mobile: value },
      }).then((user) => {
        if (user == null) {
        } else {
          return Promise.reject("Mobile number already exists");
        }
      });
    }),

  body("email")
    .isEmail()
    .trim()
    .withMessage("Enter valid email id!")
    .custom((value) => {
      return User.findOne({
        where: { email: value },
      }).then((user) => {
        if (user == null) {
        } else {
          console.log(user);
          return Promise.reject("Enter id already exists");
        }
      });
    }),

  body("password", "Enter valid password min 8 digits").isLength({
    min: 8,
    max: 100,
  }),
  body("user_type", "Enter valid role").isLength({ min: 1, max: 3 }),
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
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(req.body.password, salt);
        // Create a user
        const newUser = await User.create({
          fname: req.body.fname,
          mname: req.body.mname,
          lname: req.body.lname,
          email: req.body.email,
          mobile: req.body.mobile,
          password: encryptedPassword,
          user_type: req.body.user_type,
        });
        res
          .status(200)
          .json({ result: true, message: "User registration successful" });
      } catch (err) {
        res.status(500).send(err);
      }
    }
  },
];

module.exports = {
  addusers,
};
