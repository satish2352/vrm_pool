const User = require("../models/Users");
const { body,validationResult } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const axios = require("axios");
const toggleDeviceStatus = [
  body("mobile")
    .isLength({ min: 10, max: 10 })
    .trim()
    .withMessage("Enter valid mobile number!")
    .custom((value) => {
      return User.findOne({
        where: { mobile: value },
      }).then((user) => {
        if (user == null) {
          return Promise.reject("Please Enter Valid mobile number");
        } else {
        }
      });
    }),
  body("status")
    .isBoolean()
    .withMessage("Status must be a boolean (true or false)"),
  async (req, res) => {
    const checkErrorInValidations = validationResult(req);
    if (!checkErrorInValidations.isEmpty()) {
      return res.status(400).json({
        result: false,
        message: "Please enter valid registered mobile number",
        errors: checkErrorInValidations.array(),
      });
    } else {
      try {
        const { mobile, status } = req.body;
        let user = await User.findOne({
          where: {
            mobile: mobile,
            is_active: 1,
            is_deleted: 0,
          },
        });
        if (!user) {
          return res
            .status(400)
            .json({ result: false, message: "User not found" });
        }

        try {
          // Initial GET request
          const getUrl = `https://ccm-api.in.exotel.com/v2/accounts/icicibank100m/users?fields=devices&devices.contact_uri=${mobile}`;
          const getHeaders = {
            "Content-Type": "application/json",
            Authorization:
              "Basic NzJkODZkODZlNTY1NDI0YjVlNDIxNTlmODBmZDdjZGQ1ODk5MjUzOWMyMmNkYmQ5OmEzNWIzYTM0NmExNjcwMzk5YTcyMWQxYmQyNTEyNmVmNGNiMDdiMzc0MmEyYzFjNw==",
          };

          const response = await axios.get(getUrl, { headers: getHeaders });
          if (response.status === 200) {
            let userId = response.data.response[0].data.id;
            let deviceId = response.data.response[0].data.devices[0].id;
            const putResponse = await makePutRequest(userId, deviceId, status);

        
                if (response.response === null) {
                    console.log('No data available, response is null.');
                    return res.status(400).json({
                        result: false,
                        message: 'Request was successful but no data was found.',
                        data: apiResponse.response || {}  // Fallback to an empty object if response is null
                    });
                }
            

            if (putResponse) {
              if (status === true) {
                user.DeviceStatus = 1;
              } else {
                user.DeviceStatus = 0;
              }

              await user.save();
              return res.status(200).json({
                result: true,
                message: "Device Status Updated",
                data: putResponse.data,
              });
            } else {
              console.error(
                "PUT request failed with status:",
                putResponse.status
              );
              return res.status(400).json({
                result: false,
                message: "PUT request failed",
                data: putResponse.data,
              });
            }
          } else {
            // If the response is not 200, send a 400 response
            console.error("GET request failed with status:", response.status);
            return res.status(400).json({
              result: false,
              message: "Response failed",
              data: response.data,
            });
          }
        } catch (error) {
          // Enhanced error handling
          if (error.response) {
            // Server responded with a status other than 2xx
            console.error("Error response data:", error.response.data);
            return res.status(400).json({
              result: false,
              message: "Error occurred",
              data: error.response.data,
            });
          } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received:", error.request);
            return res.status(500).json({
              result: false,
              message: "No response received from the server",
              data: null,
            });
          } else {
            // Something happened while setting up the request
            console.error("Error message:", error.message);
            return res.status(500).json({
              result: false,
              message: "Error in request setup",
              data: null,
            });
          }
        }
      } catch (err) {
        res.status(500).send(err);
      }
    }
  },
];
async function makePutRequest(userId, deviceId, status) {
  try {
    const putUrl = `https://ccm-api.in.exotel.com/v2/accounts/icicibank100m/users/${userId}/devices/${deviceId}`;
    const putHeaders = {
      "Content-Type": "application/json",
      Authorization:
        "Basic NzJkODZkODZlNTY1NDI0YjVlNDIxNTlmODBmZDdjZGQ1ODk5MjUzOWMyMmNkYmQ5OmEzNWIzYTM0NmExNjcwMzk5YTcyMWQxYmQyNTEyNmVmNGNiMDdiMzc0MmEyYzFjNw==",
    };

    const putData = {
      available: status,
    };

    const putResponse = await axios.put(putUrl, putData, {
      headers: putHeaders,
    });

    // Check the PUT response status
    if (putResponse.status === 200 || putResponse.status === 204) {
      return {
        result: true,
        message: "PUT request successful",
        data: putResponse.data,
      };
    } else {
      console.error("PUT request failed with status:", putResponse.status);
      return {
        result: false,
        message: "PUT request failed",
        data: putResponse.data,
      };
    }
  } catch (error) {
    // Error handling for PUT request
    console.error("Error during PUT request:", error);
    return {
      result: false,
      message: "Error during PUT request",
      data: null,
    };
  }
}

function handleError(error, res) {
  if (error.response) {
    // Server responded with a status other than 2xx
    console.error("Error response data:", error.response.data);
    return res.status(400).json({
      result: false,
      message: "Error occurred",
      data: error.response.data,
    });
  } else if (error.request) {
    // The request was made but no response was received
    console.error("No response received:", error.request);
    return res.status(500).json({
      result: false,
      message: "No response received from the server",
      data: null,
    });
  } else {
    // Something happened while setting up the request
    console.error("Error message:", error.message);
    return res.status(500).json({
      result: false,
      message: "Error in request setup",
      data: null,
    });
  }
}

const changeDeviceStatus = [
  body("deviceId")
    .isLength({ min: 1, max: 25 })
    .trim()
    .withMessage("Enter valid device Id"),
  body("userId")
    .isLength({ min: 1, max: 150 })
    .trim()
    .withMessage("Enter valid user Id"),
  body("status")
    .isBoolean()
    .withMessage("Status must be a boolean (true or false)"),
  async (req, res) => {
    const checkErrorInValidations = validationResult(req);
    if (!checkErrorInValidations.isEmpty()) {
      return res.status(400).json({
        result: false,
        message: "Please enter valid details",
        errors: checkErrorInValidations.array(),
      });
    } else {
      const { userId, deviceId, status } = req.body;
      try {
        const putResponse = await makePutRequest(userId, deviceId, status);
        if (putResponse.status === 200) {
          return res.status(200).json({
            result: true,
            message: "PUT request successful",
            data: putResponse.data,
          });
        } else {
          console.error("PUT request failed with status:", putResponse.status);
          return res.status(400).json({
            result: false,
            message: "PUT request failed",
            data: putResponse.data,
          });
        }
      } catch (error) {
        // Enhanced error handling for GET request
        handleError(error, res);
      }
    }
  },
];
module.exports = {
  toggleDeviceStatus,
  changeDeviceStatus,
};
