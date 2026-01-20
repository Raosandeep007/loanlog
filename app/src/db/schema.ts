import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  pin: text('pin'), // Hashed PIN for security

  // Preferences
  defaultCurrency: text('default_currency').default('USD'),
  theme: text('theme', { enum: ['light', 'dark', 'system'] }).default('system'),
  biometricEnabled: integer('biometric_enabled', { mode: 'boolean' }).default(false),

  // Notification preferences (stored as JSON)
  notificationPreferences: text('notification_preferences', { mode: 'json' }).$type<{
    push: boolean;
    email: boolean;
    sms: boolean;
  }>().default(sql`'{"push": true, "email": false, "sms": false}'`),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Loans table
export const loans = sqliteTable('loans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Loan type
  loanType: text('loan_type', { enum: ['given', 'taken'] }).notNull(),

  // Counterparty information
  counterpartyName: text('counterparty_name').notNull(),
  counterpartyPhone: text('counterparty_phone'),
  counterpartyEmail: text('counterparty_email'),
  counterpartyAddress: text('counterparty_address'),

  // Loan details
  principalAmount: real('principal_amount').notNull(),
  currency: text('currency').default('USD'),
  issueDate: integer('issue_date', { mode: 'timestamp' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }),

  // Interest configuration
  interestRate: real('interest_rate').default(0),
  interestType: text('interest_type', { enum: ['simple', 'compound', 'none'] }).default('none'),
  compoundFrequency: text('compound_frequency', {
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']
  }),

  // Payment schedule
  paymentFrequency: text('payment_frequency', {
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'one_time', 'custom']
  }).default('monthly'),
  customPaymentInterval: integer('custom_payment_interval'), // Days for custom frequency
  numberOfInstallments: integer('number_of_installments'),
  emiAmount: real('emi_amount'),

  // Calculated fields
  totalAmountDue: real('total_amount_due'),
  totalPaid: real('total_paid').default(0),
  outstandingBalance: real('outstanding_balance'),

  // Status
  status: text('status', {
    enum: ['active', 'partially_paid', 'fully_paid', 'overdue', 'written_off']
  }).default('active'),

  // Additional information
  description: text('description'),
  notes: text('notes'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),

  // Reminder settings
  reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).default(true),
  reminderDaysBefore: text('reminder_days_before', { mode: 'json' }).$type<number[]>().default(sql`'[1, 3, 7]'`),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
});

// Payments table
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loanId: text('loan_id').notNull().references(() => loans.id, { onDelete: 'cascade' }),

  // Payment details
  amount: real('amount').notNull(),
  paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull(),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other']
  }),
  transactionReference: text('transaction_reference'),

  // Status
  status: text('status', {
    enum: ['pending', 'completed', 'failed', 'cancelled']
  }).default('completed'),

  // Breakdown
  principalPortion: real('principal_portion'),
  interestPortion: real('interest_portion'),
  balanceAfterPayment: real('balance_after_payment'),

  // Additional information
  notes: text('notes'),
  receiptUrl: text('receipt_url'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Attachments table
export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loanId: text('loan_id').references(() => loans.id, { onDelete: 'cascade' }),
  paymentId: text('payment_id').references(() => payments.id, { onDelete: 'cascade' }),

  // File information
  fileName: text('file_name').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  fileUri: text('file_uri').notNull(),
  thumbnailUri: text('thumbnail_uri'),

  // Classification
  attachmentType: text('attachment_type', {
    enum: ['agreement', 'receipt', 'bill', 'proof', 'other']
  }).default('other'),

  // Timestamps
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Reminders table
export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loanId: text('loan_id').notNull().references(() => loans.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Reminder configuration
  reminderDate: integer('reminder_date', { mode: 'timestamp' }).notNull(),
  reminderChannel: text('reminder_channel', {
    enum: ['push', 'email', 'sms']
  }).notNull(),
  message: text('message'),

  // Status
  status: text('status', {
    enum: ['scheduled', 'sent', 'failed', 'cancelled']
  }).default('scheduled'),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  errorMessage: text('error_message'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Interest log table (for tracking interest accrual)
export const interestLog = sqliteTable('interest_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loanId: text('loan_id').notNull().references(() => loans.id, { onDelete: 'cascade' }),

  // Interest calculation
  calculationDate: integer('calculation_date', { mode: 'timestamp' }).notNull(),
  principalBalance: real('principal_balance').notNull(),
  interestRate: real('interest_rate').notNull(),
  interestAccrued: real('interest_accrued').notNull(),
  cumulativeInterest: real('cumulative_interest').notNull(),
  calculationMethod: text('calculation_method'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type InterestLog = typeof interestLog.$inferSelect;
export type NewInterestLog = typeof interestLog.$inferInsert;
