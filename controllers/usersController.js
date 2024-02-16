const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require('bcryptjs');

const addusers = async (req, res) => {
  const checkErrorInValidations = validationResult(req);
  if (!checkErrorInValidations.isEmpty()) {
    return res.status(400).json({ result: false, message: 'Validation error', errors: checkErrorInValidations.array() });
  } else {
    try {
      const existingUser = await User.findOne({ where: { email: req.body.email } });
      if (existingUser) {
        return res.status(400).send({ result: false, message: 'User with entered email already exits' });
      } else {
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
        //res.status(200).send(newUser);
        res.status(200).json({ result: true, message: 'User registration successful' });
      }
    } catch (err) {
      res.status(500).send(err);
    }
  }


};


module.exports = {
  addusers,
};
