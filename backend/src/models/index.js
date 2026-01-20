/**
 * Sequelize Models Index
 * Sets up database connection and model relationships
 */

const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  }
);

// Import models
const User = require('./User')(sequelize);
const Loan = require('./Loan')(sequelize);
const Payment = require('./Payment')(sequelize);
const Attachment = require('./Attachment')(sequelize);
const Reminder = require('./Reminder')(sequelize);
const InterestLog = require('./InterestLog')(sequelize);
const RefreshToken = require('./RefreshToken')(sequelize);
const ActivityLog = require('./ActivityLog')(sequelize);

// Define relationships
// User relationships
User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' });
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activities' });

// Loan relationships
Loan.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Loan.hasMany(Payment, { foreignKey: 'loanId', as: 'payments' });
Loan.hasMany(Attachment, { foreignKey: 'loanId', as: 'attachments' });
Loan.hasMany(Reminder, { foreignKey: 'loanId', as: 'reminders' });
Loan.hasMany(InterestLog, { foreignKey: 'loanId', as: 'interestLogs' });

// Payment relationships
Payment.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });
Payment.hasMany(Attachment, { foreignKey: 'paymentId', as: 'attachments' });

// Reminder relationships
Reminder.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });
Reminder.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// InterestLog relationships
InterestLog.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });

// RefreshToken relationships
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ActivityLog relationships
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
  }
};

testConnection();

module.exports = {
  sequelize,
  User,
  Loan,
  Payment,
  Attachment,
  Reminder,
  InterestLog,
  RefreshToken,
  ActivityLog
};
