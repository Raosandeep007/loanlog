/**
 * Attachment Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attachment = sequelize.define('Attachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'loans',
        key: 'id'
      },
      field: 'loan_id'
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id'
      },
      field: 'payment_id'
    },

    // File Information
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name'
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'file_type'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'file_size'
    },
    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_url'
    },
    thumbnailUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'thumbnail_url'
    },

    // Classification
    attachmentType: {
      type: DataTypes.ENUM('agreement', 'receipt', 'bill', 'proof', 'other'),
      defaultValue: 'other',
      field: 'attachment_type'
    },

    // Metadata
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'uploaded_by'
    }
  }, {
    tableName: 'attachments',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: false,
    underscored: true
  });

  return Attachment;
};
