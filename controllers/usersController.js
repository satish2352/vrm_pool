const User = require("../models/Users");
const { body, query, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");

const addusers = async (req, res) => {
  try {
    // Create a user
    const newUser = await User.create({
      firstName: "John",
      lastName: "Doe",
    });
    res.status(200).send(newUser);
  } catch (err) {
    res.status(500).send(err);
  }
};


module.exports = {
    addusers,
};
