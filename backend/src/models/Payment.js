/**
 * Payment Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
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

    // Payment Details
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'payment_date'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other'),
      allowNull: true,
      field: 'payment_method'
    },
    transactionReference: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'transaction_reference'
    },

    // Status
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      defaultValue: 'completed'
    },

    // Breakdown
    principalPortion: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'principal_portion'
    },
    interestPortion: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'interest_portion'
    },

    // Balance After Payment
    balanceAfterPayment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'balance_after_payment'
    },

    // Additional Information
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receiptUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'receipt_url'
    },

    // Audit fields
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'updated_by'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  return Payment;
};
