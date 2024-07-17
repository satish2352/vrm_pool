const dbObj = require('../db');
const AgentData = require('./AgentData');
const User = require('./Users');

// Define associations
// AgentData.belongsTo(User, { foreignKey: 'AgentPhoneNumber', targetKey: 'mobile' });
// User.hasMany(AgentData, {
//   foreignKey: 'AgentPhoneNumber',
//   sourceKey: 'mobile'
// });


AgentData.belongsTo(User, { foreignKey: 'AgentPhoneNumber', targetKey: 'mobile' });
User.hasMany(AgentData, { foreignKey: 'AgentPhoneNumber', sourceKey: 'mobile' });
// Sync models with the database
dbObj.sync();

module.exports = {
  AgentData,
  User
};
