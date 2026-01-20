/**
 * Loan Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Loan = sequelize.define('Loan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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

    // Loan Type
    loanType: {
      type: DataTypes.ENUM('given', 'taken'),
      allowNull: false,
      field: 'loan_type'
    },

    // Counterparty Information
    counterpartyName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'counterparty_name'
    },
    counterpartyPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'counterparty_phone'
    },
    counterpartyEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'counterparty_email'
    },
    counterpartyAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'counterparty_address'
    },

    // Loan Details
    principalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      field: 'principal_amount'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'issue_date'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date'
    },

    // Interest Configuration
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100
      },
      field: 'interest_rate'
    },
    interestType: {
      type: DataTypes.ENUM('simple', 'compound', 'none'),
      defaultValue: 'none',
      field: 'interest_type'
    },
    compoundFrequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: true,
      field: 'compound_frequency'
    },

    // Payment Schedule
    paymentFrequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'one_time', 'custom'),
      defaultValue: 'monthly',
      field: 'payment_frequency'
    },
    customPaymentInterval: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'custom_payment_interval'
    },
    numberOfInstallments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'number_of_installments'
    },
    emiAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'emi_amount'
    },

    // Calculated Fields
    totalAmountDue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'total_amount_due'
    },
    totalPaid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      field: 'total_paid'
    },
    outstandingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'outstanding_balance'
    },

    // Status
    status: {
      type: DataTypes.ENUM('active', 'partially_paid', 'fully_paid', 'overdue', 'written_off'),
      defaultValue: 'active'
    },

    // Additional Information
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },

    // Reminder Settings
    reminderEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'reminder_enabled'
    },
    reminderDaysBefore: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [1, 3, 7],
      field: 'reminder_days_before'
    },

    // Timestamps
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'closed_at'
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
    tableName: 'loans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,

    hooks: {
      beforeSave: (loan) => {
        // Calculate outstanding balance
        if (loan.totalAmountDue !== null && loan.totalPaid !== null) {
          loan.outstandingBalance = parseFloat(loan.totalAmountDue) - parseFloat(loan.totalPaid);
        }

        // Update status based on payments
        if (loan.outstandingBalance !== null) {
          if (loan.outstandingBalance <= 0) {
            loan.status = 'fully_paid';
            loan.closedAt = new Date();
          } else if (loan.totalPaid > 0) {
            loan.status = 'partially_paid';
          } else if (loan.dueDate && new Date(loan.dueDate) < new Date() && loan.outstandingBalance > 0) {
            loan.status = 'overdue';
          } else {
            loan.status = 'active';
          }
        }
      }
    }
  });

  return Loan;
};
