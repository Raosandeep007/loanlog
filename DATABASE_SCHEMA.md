# LoanLog - Database Schema

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    Users    │────────<│    Loans     │>────────│  Payments   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               │                         │
                               v                         v
                        ┌──────────────┐         ┌─────────────┐
                        │ Attachments  │         │  Reminders  │
                        └──────────────┘         └─────────────┘
                               │
                               v
                        ┌──────────────┐
                        │ InterestLog  │
                        └──────────────┘
```

## Table Definitions

### 1. Users Table
Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_image_url TEXT,

  -- Security
  pin_hash VARCHAR(255),
  biometric_enabled BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,

  -- Preferences
  default_currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"push": true, "email": true, "sms": false, "whatsapp": false}',
  theme VARCHAR(10) DEFAULT 'light',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Audit
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_active ON users(is_active);
```

### 2. Loans Table
Core table for tracking loans given or taken.

```sql
CREATE TYPE loan_type AS ENUM ('given', 'taken');
CREATE TYPE interest_type AS ENUM ('simple', 'compound', 'none');
CREATE TYPE loan_status AS ENUM ('active', 'partially_paid', 'fully_paid', 'overdue', 'written_off');
CREATE TYPE payment_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'one_time', 'custom');

CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Loan Type
  loan_type loan_type NOT NULL,

  -- Counterparty Information
  counterparty_name VARCHAR(255) NOT NULL,
  counterparty_phone VARCHAR(20),
  counterparty_email VARCHAR(255),
  counterparty_address TEXT,

  -- Loan Details
  principal_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  issue_date DATE NOT NULL,
  due_date DATE,

  -- Interest Configuration
  interest_rate DECIMAL(5, 2) DEFAULT 0.00,  -- Annual percentage
  interest_type interest_type DEFAULT 'none',
  compound_frequency payment_frequency,  -- For compound interest

  -- Payment Schedule
  payment_frequency payment_frequency DEFAULT 'monthly',
  custom_payment_interval INTEGER,  -- Days for custom frequency
  number_of_installments INTEGER,
  emi_amount DECIMAL(15, 2),

  -- Calculated Fields
  total_amount_due DECIMAL(15, 2),  -- Principal + Interest
  total_paid DECIMAL(15, 2) DEFAULT 0.00,
  outstanding_balance DECIMAL(15, 2),

  -- Status
  status loan_status DEFAULT 'active',

  -- Additional Information
  description TEXT,
  notes TEXT,
  tags TEXT[],

  -- Reminder Settings
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER[] DEFAULT ARRAY[1, 3, 7],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_type ON loans(loan_type);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_counterparty ON loans(counterparty_name);
CREATE INDEX idx_loans_created_at ON loans(created_at);
```

### 3. Payments Table
Tracks all payment transactions for loans.

```sql
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

  -- Payment Details
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method payment_method,
  transaction_reference VARCHAR(255),

  -- Status
  status payment_status DEFAULT 'completed',

  -- Breakdown (for transparency)
  principal_portion DECIMAL(15, 2),
  interest_portion DECIMAL(15, 2),

  -- Balance After Payment
  balance_after_payment DECIMAL(15, 2),

  -- Additional Information
  notes TEXT,
  receipt_url TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Audit
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_payments_loan ON payments(loan_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

### 4. Attachments Table
Stores file attachments for loans and payments.

```sql
CREATE TYPE attachment_type AS ENUM ('agreement', 'receipt', 'bill', 'proof', 'other');

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,

  -- File Information
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,  -- bytes
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Classification
  attachment_type attachment_type DEFAULT 'other',

  -- Metadata
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID REFERENCES users(id),

  CONSTRAINT check_attachment_parent CHECK (
    (loan_id IS NOT NULL AND payment_id IS NULL) OR
    (loan_id IS NULL AND payment_id IS NOT NULL)
  )
);

CREATE INDEX idx_attachments_loan ON attachments(loan_id);
CREATE INDEX idx_attachments_payment ON attachments(payment_id);
```

### 5. Reminders Table
Manages scheduled reminders for payments.

```sql
CREATE TYPE reminder_status AS ENUM ('scheduled', 'sent', 'failed', 'cancelled');
CREATE TYPE reminder_channel AS ENUM ('push', 'email', 'sms', 'whatsapp');

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reminder Configuration
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_channel reminder_channel NOT NULL,
  message TEXT,

  -- Status
  status reminder_status DEFAULT 'scheduled',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_loan ON reminders(loan_id);
CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_status ON reminders(status);
```

### 6. Interest Log Table
Tracks interest accrual for audit and calculation history.

```sql
CREATE TABLE interest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

  -- Interest Calculation
  calculation_date DATE NOT NULL,
  principal_balance DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  interest_accrued DECIMAL(15, 2) NOT NULL,
  cumulative_interest DECIMAL(15, 2) NOT NULL,

  -- Method Used
  calculation_method VARCHAR(50),  -- 'simple', 'compound_daily', 'compound_monthly', etc.

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interest_log_loan ON interest_log(loan_id);
CREATE INDEX idx_interest_log_date ON interest_log(calculation_date);
```

### 7. Refresh Tokens Table
For JWT authentication.

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

### 8. Activity Log Table
Audit trail for all important actions.

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Activity Details
  action VARCHAR(100) NOT NULL,  -- 'create_loan', 'add_payment', 'update_loan', etc.
  entity_type VARCHAR(50),  -- 'loan', 'payment', 'user', etc.
  entity_id UUID,

  -- Details
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
```

## Views for Common Queries

### Dashboard Summary View
```sql
CREATE VIEW dashboard_summary AS
SELECT
  u.id as user_id,

  -- Loans Given
  COUNT(*) FILTER (WHERE l.loan_type = 'given') as loans_given_count,
  COALESCE(SUM(l.principal_amount) FILTER (WHERE l.loan_type = 'given'), 0) as total_lent,
  COALESCE(SUM(l.outstanding_balance) FILTER (WHERE l.loan_type = 'given'), 0) as receivables,

  -- Loans Taken
  COUNT(*) FILTER (WHERE l.loan_type = 'taken') as loans_taken_count,
  COALESCE(SUM(l.principal_amount) FILTER (WHERE l.loan_type = 'taken'), 0) as total_borrowed,
  COALESCE(SUM(l.outstanding_balance) FILTER (WHERE l.loan_type = 'taken'), 0) as payables,

  -- Net Position
  COALESCE(SUM(l.outstanding_balance) FILTER (WHERE l.loan_type = 'given'), 0) -
  COALESCE(SUM(l.outstanding_balance) FILTER (WHERE l.loan_type = 'taken'), 0) as net_position,

  -- Overdue
  COUNT(*) FILTER (WHERE l.status = 'overdue') as overdue_count,
  COALESCE(SUM(l.outstanding_balance) FILTER (WHERE l.status = 'overdue'), 0) as overdue_amount

FROM users u
LEFT JOIN loans l ON u.id = l.user_id
GROUP BY u.id;
```

### Upcoming Payments View
```sql
CREATE VIEW upcoming_payments AS
SELECT
  l.id as loan_id,
  l.user_id,
  l.counterparty_name,
  l.loan_type,
  l.due_date,
  l.emi_amount,
  l.outstanding_balance,
  l.payment_frequency,
  CASE
    WHEN l.due_date < CURRENT_DATE THEN 'overdue'
    WHEN l.due_date = CURRENT_DATE THEN 'due_today'
    WHEN l.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_this_week'
    ELSE 'upcoming'
  END as urgency
FROM loans l
WHERE l.status IN ('active', 'partially_paid', 'overdue')
  AND l.outstanding_balance > 0
ORDER BY l.due_date ASC;
```

## Database Functions

### Calculate Next Payment Date
```sql
CREATE OR REPLACE FUNCTION calculate_next_payment_date(
  current_date DATE,
  frequency payment_frequency,
  custom_days INTEGER DEFAULT NULL
) RETURNS DATE AS $$
BEGIN
  RETURN CASE frequency
    WHEN 'daily' THEN current_date + INTERVAL '1 day'
    WHEN 'weekly' THEN current_date + INTERVAL '1 week'
    WHEN 'biweekly' THEN current_date + INTERVAL '2 weeks'
    WHEN 'monthly' THEN current_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN current_date + INTERVAL '3 months'
    WHEN 'yearly' THEN current_date + INTERVAL '1 year'
    WHEN 'custom' THEN current_date + (custom_days || ' days')::INTERVAL
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Update Loan Status Trigger
```sql
CREATE OR REPLACE FUNCTION update_loan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update outstanding balance
  NEW.outstanding_balance := NEW.total_amount_due - NEW.total_paid;

  -- Update status based on payments
  IF NEW.outstanding_balance <= 0 THEN
    NEW.status := 'fully_paid';
    NEW.closed_at := CURRENT_TIMESTAMP;
  ELSIF NEW.total_paid > 0 THEN
    NEW.status := 'partially_paid';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.outstanding_balance > 0 THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loan_status
BEFORE UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_loan_status();
```

### Update Loan Totals After Payment
```sql
CREATE OR REPLACE FUNCTION update_loan_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE loans
  SET
    total_paid = total_paid + NEW.amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.loan_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loan_after_payment
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_loan_after_payment();
```

## Indexes for Performance

```sql
-- Composite indexes for common queries
CREATE INDEX idx_loans_user_status ON loans(user_id, status);
CREATE INDEX idx_loans_user_type ON loans(user_id, loan_type);
CREATE INDEX idx_loans_due_status ON loans(due_date, status) WHERE status IN ('active', 'partially_paid', 'overdue');

-- Full-text search on counterparty names
CREATE INDEX idx_loans_counterparty_search ON loans USING GIN(to_tsvector('english', counterparty_name));

-- Partial indexes for active records
CREATE INDEX idx_active_loans ON loans(user_id) WHERE status IN ('active', 'partially_paid', 'overdue');
CREATE INDEX idx_scheduled_reminders ON reminders(reminder_date) WHERE status = 'scheduled';
```

## Data Integrity Constraints

```sql
-- Ensure positive amounts
ALTER TABLE loans ADD CONSTRAINT check_positive_principal CHECK (principal_amount > 0);
ALTER TABLE payments ADD CONSTRAINT check_positive_payment CHECK (amount > 0);

-- Ensure valid interest rate
ALTER TABLE loans ADD CONSTRAINT check_interest_rate CHECK (interest_rate >= 0 AND interest_rate <= 100);

-- Ensure due date is after issue date
ALTER TABLE loans ADD CONSTRAINT check_dates CHECK (due_date IS NULL OR due_date >= issue_date);

-- Ensure payment date is not in future (can be relaxed for scheduled payments)
ALTER TABLE payments ADD CONSTRAINT check_payment_date CHECK (payment_date <= CURRENT_DATE);
```
