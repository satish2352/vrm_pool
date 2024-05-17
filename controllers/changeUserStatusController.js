const User = require("../models/Users");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const changeUserStatus = [

    body("id", "Enter valid id").isLength({
        min: 1,
    }),
    body("status", "Enter valid status").custom(value => {        
        if (value.length !== 1 || !['0', '1'].includes(value)) {
            throw new Error("Status should have a length of 1 and contain only '0' or '1'");
        }
        return true; // Return true to indicate validation passed
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
                let status = req.body.status;
                if (user_type) {
                    if (user_type == '1') {

                        let user = await User.findByPk(idTobeUpdated);
                        if (!user) {
                            return res.status(404).json({ result: false, message: "User not found" });
                        }
                        if (user) {

                            const conditionCount = await User.count({
                                where: {
                                    added_by: user.id,                                
                                    is_deleted:1,
                                    is_active:0,                                
                                }
                            });
                            
                            if (conditionCount > 0) {
                                return res.status(400).json({ result: false, message: `User status can not be changed as supervisor mapped to this user is deleated`});
                            } else {


                            // Update the name attribute
                            user.is_active = status;
                            // Save the changes to the database
                            await user.save()
                            .then(updatedUser => {
                                // Handle successful update
                                //console.log('User status updated successfully:', updatedUser);
                                return res.status(200).json({ result: true, message: "User status updated successfully" });
                            })
                            .catch(error => {
                                // Handle update error
                                console.error('Error updating user status:', error);
                                return res.status(500).json({ result: false, message: "Error updating user status" });
                            });
                        }

                    } else {                                            
                        return res.status(400).send({ result: false, message: "You are not authorized" });
                    }

                }
            }else{
                return res.status(400).send({ result: false, message: "Error occured during api call" });
            }
        }
        } catch (err) {
            console.log(err);
            res.status(500).send({ result: false, err });
        }
    },
];

module.exports = {
    changeUserStatus,
};
