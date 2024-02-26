const User = require("../models/Users");
const Token = require("../models/Token");
const { body, query, validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const bcrypt = require("bcryptjs");
var jwt = require('jsonwebtoken');
const verifyToken = require("../middleware/verifyToken");
const JWT_SECRET = "realEstateApp$ecret$493458395789";

const logOut = [
    verifyToken,    
    async (req, res) => {       
                       
                try {
                    const userId = req.user.id; // Assuming verifyToken middleware sets userId in req.user
        
                    // Delete the token associated with the user from the database
                    let result=await Token.destroy({
                        where: {
                            userId: userId
                        }
                    });        
                    return res.status(200).json({
                        result: true,
                        message: 'User logout successful'
                    });
                } catch (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
    }
        
];

module.exports = {
    logOut
};
