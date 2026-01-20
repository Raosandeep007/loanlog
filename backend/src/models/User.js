/**
 * User Model
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[+]?[\d\s-()]+$/
      }
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'full_name'
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    profileImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'profile_image_url'
    },

    // Security
    pinHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'pin_hash'
    },
    biometricEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'biometric_enabled'
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },

    // Preferences
    defaultCurrency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      field: 'default_currency'
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC'
    },
    notificationPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        push: true,
        email: true,
        sms: false,
        whatsapp: false
      },
      field: 'notification_preferences'
    },
    theme: {
      type: DataTypes.STRING(10),
      defaultValue: 'light',
      validate: {
        isIn: [['light', 'dark']]
      }
    },

    // Metadata
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,

    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.pinHash;
    return values;
  };

  return User;
};
