const verifyToken = require("../middleware/verifyToken");
const Users = require("../models/Users");
const { body } = require("express-validator");
const { Op } = require('sequelize');
const apiResponse = require("../helpers/apiResponse");
require('dotenv').config();

const getUserList = [
  body(),
  verifyToken,
  async (req, res) => {
    const user_type = req.body.user_type; // Filter by role
    const superviserId = req.body.superviserId; // Filter by supervisor ID
    const { page = 1} = req.body;
    if(!page)
      {
          page=1;
      }
    var pageSize =process.env.PAGE_LENGTH
    const  customPageSize = req.body.pageSize;
    if(customPageSize)
      {
        pageSize =customPageSize
      }

    try {
      let userFilter = {};

      if (req.user.user_type == '1') {
        userFilter = {
          is_deleted: '0',
        };
      } else {
        userFilter = {
          is_deleted: '0',
          is_active: '1'
        };
      }

      if (user_type) {
        userFilter.user_type = user_type;
      } else {
        userFilter.user_type = { [Op.in]: [2, 3] };
      }

      if (superviserId) {
        userFilter.added_by = superviserId;
      }

      // Pagination parameters
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      // Fetch users with pagination
      const { count, rows: reports } = await Users.findAndCountAll({
        attributes: ['id', 'name', 'email', 'mobile', 'user_type', 'is_active', 'is_deleted','DeviceStatus'],
        where: userFilter,
        order: [['id', 'DESC']],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / pageSize);

      const resData = {
        result: true,
        data: reports,
        totalItems: count,
        totalPages: totalPages,
        currentPage: page,
        pageSize: pageSize,
      };

      return res.status(200).json(resData);
    } catch (error) {
      apiResponse.ErrorResponse(res, "Error occurred during API call");
      console.error('Error fetching users with filters:', error);
      throw error;
    }
  },
];

module.exports = {
  getUserList,
};
