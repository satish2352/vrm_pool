const verifyToken = require("../middleware/verifyToken");
const Report = require("../models/Report");
const User = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col } = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");

User.hasMany(Report, { foreignKey: 'user_id' });
Report.belongsTo(User, { foreignKey: 'user_id' });

const getReportsSingleRow = [
    verifyToken,
    async (req, res) => {
        try {
            const { user_type, fromdate, todate, status,  supervisor_id,agent_id,direction } = req.body;

            // Construct filter for Users
            let userFilter = {};
            if (user_type) {
                userFilter.user_type = user_type;
            }
            if (supervisor_id) {
                userFilter.added_by = supervisor_id;
            }

            if (agent_id) {
                userFilter.id = agent_id;
            }

            // Fetch user data based on filters
            const users = await User.findAll({
                where: userFilter,
            });

            // Extract user IDs for filtering reports
            const userIds = users.map(user => user.id);

            // Construct filter for Reports
            let reportFilter = {
                user_id: userIds,
            };
            if (fromdate && todate) {
                reportFilter.createdAt = {
                    [Op.between]: [fromdate+" 00:00:00", todate+" 23:59:59"]
                };
            }
            if (status) {
                reportFilter.status = status;
            }

            if (direction) {
                reportFilter.direction = direction;
            }


            // Fetch reports based on filters
            const reports = await Report.findAll({
                attributes: [
                    [fn('COUNT', col('Reports.id')), 'count'], // Using fn and col to count id and duration
                    [fn('SUM', col('duration')), 'duration']
                ],

                where: reportFilter,
                include: [{
                    model: User,
                    attributes: ['mobile', 'id', 'fname', 'mname', 'lname', 'email', 'user_type', 'is_active'],
                }],
                order: [['createdAt', 'DESC']]
            });

            apiResponse.successResponseWithData(res, 'All details get successfully', reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

module.exports = {
    getReportsSingleRow,
};
