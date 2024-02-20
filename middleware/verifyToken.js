const Token = require("../models/Token");
const Users = require("../models/Users");
var jwt = require('jsonwebtoken');
const JWT_SECRET = "realEstateApp$ecret$493458395789";
const verifyToken=async (req,res,next)=>{
    const token=req.header('auth-token');
    if(!token){
        console.log("No token received");
      res.status(401).send({result:false,message:'Invalid token'});
    }
    try{

        try {
            //console.log(token);
            const decoded = jwt.verify(token, JWT_SECRET);
            //console.log(decoded);
            // Check if token ID exists in the database and if it's not expired
            const tokenInfo = await Token.findOne({ where: { token } });
            if (!tokenInfo || tokenInfo.expiration < new Date()) {
                throw new Error('Failed to validate token');
            }
           
        // Assuming you have a User model with `findById` method
        const user = await Users.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach the user to the request object for further use
        req.user = user;    
           next()
          } catch (error) {
            throw new Error('Failed to validate token');
          }
        // const data=jwt.verify(token,JWT_SECRET);
        // req.user=data.user;
        // next();
    }catch(error){
        res.status(401).send({result:false,message:'Invalid token'});
    }
}
module.exports = verifyToken;