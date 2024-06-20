const verifyToken = require("../middleware/verifyToken");
const AgentData = require("../models/AgentData");
const User = require("../models/Users");
const { validationResult } = require("express-validator");
const { Op, fn, col, literal } = require('sequelize'); // Importing Op, fn, and col from sequelize
const apiResponse = require("../helpers/apiResponse");
const moment = require('moment-timezone');
const ExcelJS = require('exceljs');

User.hasMany(AgentData, { foreignKey: 'user_id' });
AgentData.belongsTo(User, { foreignKey: 'user_id' });

const getSingleRowExportExcel = [
    verifyToken,
    async (req, res) => {
        try {
            const { user_type, supervisor_id, agent_id, fromtime, totime, page = 1,} = req.body;

            if(!page)
                {
                    page=1;
                }
            pageSize =process.env.PAGE_LENGTH
            const  customPageSize = req.body.pageSize;
            if(customPageSize)
              {
                pageSize =customPageSize
              }
        
            // Construct filter for Users
            let userFilter = {
                is_active: 1,
                is_deleted: 0
            };
            if (user_type) {
                userFilter.user_type = user_type;
            }
            if (supervisor_id) {
                userFilter.added_by = supervisor_id;
            }

            if (Array.isArray(agent_id)) {
                if (agent_id.length > 0) {
                    userFilter.id = agent_id;
                }
            }
            const users = await User.findAll({
                where: userFilter,
            });

            const userIds = users.map(user => user.id);

            // Construct filter for Reports
            let reportFilter = {
                user_id: userIds,
            };
            if (fromtime && totime) {
                reportFilter.updatedAt = {
                    [Op.between]: [fromtime, totime]
                };
            }

            // Pagination parameters
            const offset = (page - 1) * pageSize;
            const limit = parseInt(pageSize);

            // Fetch reports based on filters with pagination
            const { count, rows: reports } = await AgentData.findAndCountAll({
                attributes: [
                    [
                        fn('SUM', col('IncomingCalls')),
                        'IncomingCalls'
                    ],
                    [
                        fn('SUM', col('MissedCalls')),
                        'MissedCalls'
                    ],
                    [
                        fn('SUM', col('NoAnswer')),
                        'NoAnswer'
                    ],
                    [
                        fn('SUM', col('Busy')),
                        'Busy'
                    ],
                    [
                        fn('SUM', col('Failed')),
                        'Failed'
                    ],
                    [
                        fn('SUM', col('OutgoingCalls')),
                        'OutgoingCalls'
                    ],
                    [fn('AVG', col('DeviceOnPercent')), 
                        'DeviceOnPercent'
                    ],
                    [
                        fn('SUM', col('TotalCallDurationInMinutes')),
                        'TotalCallDurationInMinutes'
                    ],
                    [
                        fn('SUM', col('DeviceOnHumanReadableInSeconds')),
                        'DeviceOnHumanReadableInSeconds'
                    ],
                    [
                        fn('COUNT', col('DeviceOnPercent')),
                        'TotalRowsCount'
                    ],
                    'DeviceOnHumanReadable',
                ],
                where: reportFilter,
                include: [{
                    model: User,
                    attributes: ['mobile', 'id', 'name', 'email', 'user_type', 'is_active'],
                }],
                group: ['user_id'],
                order: [['createdAt', 'DESC']],            
            });


                // Generate Excel file
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Agent Reports');

                // Add columns
                worksheet.columns = [
                   
                    { header: 'RM Name', key: 'name', width: 20 },
                    { header: 'RM Mobile Number', key: 'mobile', width: 15 },
                    { header: 'RM Email', key: 'email', width: 30 },                
                    { header: 'Incoming Calls', key: 'IncomingCalls', width: 15 },
                    { header: 'Missed Calls', key: 'MissedCalls', width: 15 },
                    { header: 'No Answer', key: 'NoAnswer', width: 10 },
                    { header: 'Busy', key: 'Busy', width: 10 },
                    { header: 'Failed', key: 'Failed', width: 10 },
                    { header: 'Outgoing Calls', key: 'OutgoingCalls', width: 15 },
                    { header: 'Total Call Duration (Minutes)', key: 'TotalCallDurationInMinutes', width: 25 },
                    { header: 'Average Handling Time (Minutes)', key: 'AverageHandlingTimeInMinutes', width: 25 },
                    { header: 'Device On Percent', key: 'DeviceOnPercent', width: 15 },
                    { header: 'Device On Human Readable (Seconds)', key: 'DeviceOnHumanReadableInSeconds', width: 30 },
                   
                ];
                // Add rows
                reports.forEach(report => {
                    worksheet.addRow({
                        mobile: report.user.mobile,
                        name: report.user.name,
                        email: report.user.email,
                        user_type: report.user.user_type,
                        is_active: report.user.is_active,
                        IncomingCalls: report.dataValues.IncomingCalls,
                        MissedCalls: report.dataValues.MissedCalls,
                        NoAnswer: report.dataValues.NoAnswer,
                        Busy: report.dataValues.Busy,
                        Failed: report.dataValues.Failed,
                        OutgoingCalls: report.dataValues.OutgoingCalls,
                        TotalCallDurationInMinutes: report.dataValues.TotalCallDurationInMinutes,
                        AverageHandlingTimeInMinutes: report.dataValues.AverageHandlingTimeInMinutes,
                        DeviceOnPercent: report.dataValues.DeviceOnPercent,
                        DeviceOnHumanReadableInSeconds: report.dataValues.DeviceOnHumanReadableInSeconds                    
                    });
                });
                // Write to buffer
                const buffer = await workbook.xlsx.writeBuffer();
                // Send the buffer as an Excel file
                res.setHeader('Content-Disposition', 'attachment; filename="AgentReports.xlsx"');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                return res.send(buffer);

    
        } catch (error) {
            console.error('Error fetching reports:', error);
            apiResponse.ErrorResponse(res, "Error occurred during API call");
        }
    },
];

module.exports = {
    getSingleRowExportExcel,
};
