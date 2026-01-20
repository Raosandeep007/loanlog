/**
 * Reminder Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reminder = sequelize.define('Reminder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'loans',
        key: 'id'
      },
      field: 'loan_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },

    // Reminder Configuration
    reminderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'reminder_date'
    },
    reminderChannel: {
      type: DataTypes.ENUM('push', 'email', 'sms', 'whatsapp'),
      allowNull: false,
      field: 'reminder_channel'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Status
    status: {
      type: DataTypes.ENUM('scheduled', 'sent', 'failed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    }
  }, {
    tableName: 'reminders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  return Reminder;
};
