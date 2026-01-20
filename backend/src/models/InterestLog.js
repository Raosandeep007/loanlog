/**
 * Interest Log Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InterestLog = sequelize.define('InterestLog', {
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

    // Interest Calculation
    calculationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'calculation_date'
    },
    principalBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'principal_balance'
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'interest_rate'
    },
    interestAccrued: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'interest_accrued'
    },
    cumulativeInterest: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'cumulative_interest'
    },

    // Method Used
    calculationMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'calculation_method'
    }
  }, {
    tableName: 'interest_log',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  return InterestLog;
};
