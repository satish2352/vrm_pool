const User = require("../models/Users");
const verifyToken = require("../middleware/verifyToken");
const { body, query, validationResult } = require("express-validator");
const deleteUser = [

    body("id", "Enter valid id").isLength({
        min: 1,
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
                if (user_type) {
                    if (user_type == '1') {

                        let user = await User.findByPk(idTobeUpdated);
                        if (!user) {
                            return res.status(404).json({ result: false, message: "User not found" });
                        }
                        if (user) {

                            if (user.user_type == '2') {
                                const conditionCount = await User.count({
                                    where: {
                                        added_by: idTobeUpdated,
                                        is_active:1,
                                    }
                                });

                                if (conditionCount > 0) {
 
                                    return res.status(400).json({ result: false, message: `User cant be deleted because ${conditionCount} relationship  managers are mapped to this user`});
                                } else {
                                    // Update the name attribute
                                    user.is_deleted = '1';
                                    // Save the changes to the database
                                    await user.save()
                                        .then(updatedUser => {
                                            // Handle successful update
                                            //console.log('User status updated successfully:', updatedUser);
                                            return res.status(200).json({ result: true, message: "User deleted successfully" });
                                        })
                                        .catch(error => {
                                            // Handle update error
                                            console.error('Error updating user status:', error);
                                            return res.status(500).json({ result: false, message: "Error updating user status" });
                                        });

                                }


                            } else {
                                // Update the name attribute
                                user.is_deleted = '1';
                                // Save the changes to the database
                                await user.save()
                                    .then(updatedUser => {
                                        // Handle successful update
                                        //console.log('User status updated successfully:', updatedUser);
                                        return res.status(200).json({ result: true, message: "User deleted updated successfully" });
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
                } else {
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
    deleteUser,
};
