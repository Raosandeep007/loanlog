# LoanLog - REST API Specification

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.loanlog.app/v1
```

## Authentication
All API endpoints (except `/auth/*`) require JWT authentication.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-01-20T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "timestamp": "2026-01-20T10:30:00Z"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## API Endpoints

### 1. Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "isVerified": false
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 900
    }
  }
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

#### Logout
```http
POST /auth/logout
```

#### Verify Biometric
```http
POST /auth/biometric/verify
```

**Request Body:**
```json
{
  "biometricToken": "device_biometric_token",
  "deviceId": "device_uuid"
}
```

---

### 2. Loans

#### Create Loan
```http
POST /loans
```

**Request Body:**
```json
{
  "loanType": "given",
  "counterpartyName": "Alice Smith",
  "counterpartyPhone": "+1234567890",
  "counterpartyEmail": "alice@example.com",
  "principalAmount": 10000.00,
  "currency": "USD",
  "issueDate": "2026-01-20",
  "dueDate": "2027-01-20",
  "interestRate": 12.0,
  "interestType": "compound",
  "compoundFrequency": "monthly",
  "paymentFrequency": "monthly",
  "numberOfInstallments": 12,
  "description": "Business loan",
  "tags": ["business", "urgent"],
  "reminderEnabled": true,
  "reminderDaysBefore": [1, 3, 7]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "loan": {
      "id": "uuid",
      "loanType": "given",
      "counterpartyName": "Alice Smith",
      "principalAmount": 10000.00,
      "totalAmountDue": 10634.13,
      "emiAmount": 886.18,
      "outstandingBalance": 10634.13,
      "status": "active",
      "createdAt": "2026-01-20T10:30:00Z",
      "...": "..."
    },
    "amortizationSchedule": [ ... ]
  }
}
```

#### Get All Loans
```http
GET /loans?page=1&limit=10&type=given&status=active&sortBy=dueDate&order=asc
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `type` (optional): Filter by loan type (`given`, `taken`)
- `status` (optional): Filter by status (`active`, `partially_paid`, `fully_paid`, `overdue`)
- `sortBy` (optional): Sort field (`createdAt`, `dueDate`, `amount`)
- `order` (optional): Sort order (`asc`, `desc`)
- `search` (optional): Search in counterparty name
- `minAmount` (optional): Filter by minimum amount
- `maxAmount` (optional): Filter by maximum amount
- `dateFrom` (optional): Filter by date range start
- `dateTo` (optional): Filter by date range end

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "loans": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10
    }
  }
}
```

#### Get Loan by ID
```http
GET /loans/:loanId
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "loan": { ... },
    "paymentHistory": [ ... ],
    "amortizationSchedule": [ ... ],
    "attachments": [ ... ],
    "reminders": [ ... ]
  }
}
```

#### Update Loan
```http
PUT /loans/:loanId
```

**Request Body:** (partial update supported)
```json
{
  "counterpartyPhone": "+9876543210",
  "notes": "Updated notes"
}
```

#### Delete Loan
```http
DELETE /loans/:loanId
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Loan deleted successfully"
}
```

#### Get Loan Amortization Schedule
```http
GET /loans/:loanId/amortization
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "installmentNumber": 1,
        "dueDate": "2026-02-20",
        "emiAmount": 886.18,
        "principalComponent": 786.18,
        "interestComponent": 100.00,
        "remainingBalance": 9213.82,
        "isPaid": false
      },
      ...
    ]
  }
}
```

#### Calculate Loan Details (Preview)
```http
POST /loans/calculate
```

**Request Body:**
```json
{
  "principalAmount": 10000,
  "interestRate": 12,
  "interestType": "compound",
  "compoundFrequency": "monthly",
  "numberOfInstallments": 12,
  "paymentFrequency": "monthly"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "emiAmount": 886.18,
    "totalAmountDue": 10634.13,
    "totalInterest": 634.13,
    "schedule": [ ... ]
  }
}
```

---

### 3. Payments

#### Record Payment
```http
POST /loans/:loanId/payments
```

**Request Body:**
```json
{
  "amount": 886.18,
  "paymentDate": "2026-02-20",
  "paymentMethod": "bank_transfer",
  "transactionReference": "TXN123456",
  "notes": "First EMI payment",
  "receiptUrl": "https://storage.example.com/receipt.pdf"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "uuid",
      "loanId": "loan_uuid",
      "amount": 886.18,
      "principalPortion": 786.18,
      "interestPortion": 100.00,
      "balanceAfterPayment": 9213.82,
      "paymentDate": "2026-02-20",
      "status": "completed"
    },
    "updatedLoan": {
      "outstandingBalance": 9213.82,
      "totalPaid": 886.18,
      "status": "partially_paid"
    }
  }
}
```

#### Get Payment History
```http
GET /loans/:loanId/payments
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "amount": 886.18,
        "paymentDate": "2026-02-20",
        "principalPortion": 786.18,
        "interestPortion": 100.00,
        "balanceAfterPayment": 9213.82,
        "paymentMethod": "bank_transfer",
        "transactionReference": "TXN123456"
      },
      ...
    ],
    "summary": {
      "totalPaid": 1772.36,
      "totalPrincipalPaid": 1590.43,
      "totalInterestPaid": 181.93,
      "remainingBalance": 8443.70
    }
  }
}
```

#### Update Payment
```http
PUT /payments/:paymentId
```

#### Delete Payment
```http
DELETE /payments/:paymentId
```

---

### 4. Dashboard & Analytics

#### Get Dashboard Summary
```http
GET /dashboard/summary
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "loansGiven": {
      "count": 5,
      "totalAmount": 50000.00,
      "receivables": 35000.00
    },
    "loansTaken": {
      "count": 2,
      "totalAmount": 20000.00,
      "payables": 15000.00
    },
    "netPosition": 20000.00,
    "overdue": {
      "count": 1,
      "amount": 5000.00
    },
    "upcomingPayments": [
      {
        "loanId": "uuid",
        "counterpartyName": "Alice",
        "dueDate": "2026-01-25",
        "amount": 886.18,
        "urgency": "due_this_week"
      }
    ]
  }
}
```

#### Get Cash Flow Analytics
```http
GET /analytics/cashflow?startDate=2026-01-01&endDate=2026-12-31&groupBy=month
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "cashFlow": [
      {
        "period": "2026-01",
        "received": 5000.00,
        "paid": 2000.00,
        "net": 3000.00
      },
      ...
    ]
  }
}
```

#### Get Interest Analytics
```http
GET /analytics/interest?year=2026
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "interestEarned": 3450.00,
    "interestPaid": 1200.00,
    "netInterest": 2250.00,
    "monthlyBreakdown": [ ... ]
  }
}
```

#### Get Loan Distribution
```http
GET /analytics/distribution
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "byCounterparty": [
      {
        "name": "Alice Smith",
        "loansCount": 3,
        "totalAmount": 25000.00,
        "outstanding": 15000.00
      }
    ],
    "byStatus": {
      "active": 5,
      "partially_paid": 3,
      "fully_paid": 10,
      "overdue": 1
    }
  }
}
```

---

### 5. Attachments

#### Upload Attachment
```http
POST /loans/:loanId/attachments
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload
- `attachmentType`: Type of attachment (`agreement`, `receipt`, `bill`, `proof`, `other`)
- `description`: Optional description

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "attachment": {
      "id": "uuid",
      "fileName": "agreement.pdf",
      "fileType": "application/pdf",
      "fileSize": 245678,
      "fileUrl": "https://storage.example.com/attachments/uuid.pdf",
      "thumbnailUrl": "https://storage.example.com/thumbnails/uuid.jpg",
      "attachmentType": "agreement",
      "uploadedAt": "2026-01-20T10:30:00Z"
    }
  }
}
```

#### Get Attachments
```http
GET /loans/:loanId/attachments
```

#### Delete Attachment
```http
DELETE /attachments/:attachmentId
```

---

### 6. Reminders

#### Get Reminders
```http
GET /reminders?status=scheduled&upcoming=true
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "id": "uuid",
        "loanId": "loan_uuid",
        "reminderDate": "2026-01-22T09:00:00Z",
        "reminderChannel": "push",
        "message": "Payment due in 3 days for loan to Alice Smith",
        "status": "scheduled"
      }
    ]
  }
}
```

#### Update Reminder Settings
```http
PUT /loans/:loanId/reminders
```

**Request Body:**
```json
{
  "reminderEnabled": true,
  "reminderDaysBefore": [1, 3, 7],
  "channels": ["push", "email"]
}
```

#### Snooze Reminder
```http
POST /reminders/:reminderId/snooze
```

**Request Body:**
```json
{
  "snoozeUntil": "2026-01-23T09:00:00Z"
}
```

---

### 7. Reports

#### Generate Report
```http
POST /reports/generate
```

**Request Body:**
```json
{
  "reportType": "loan_summary",
  "format": "pdf",
  "dateFrom": "2026-01-01",
  "dateTo": "2026-12-31",
  "filters": {
    "loanType": "given",
    "status": "active"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reportUrl": "https://storage.example.com/reports/report_uuid.pdf",
    "expiresAt": "2026-01-27T10:30:00Z"
  }
}
```

#### Export Data
```http
GET /export?format=csv&type=loans&filters[status]=active
```

**Response:** CSV/Excel file download

---

### 8. User Profile

#### Get Profile
```http
GET /users/me
```

#### Update Profile
```http
PUT /users/me
```

**Request Body:**
```json
{
  "fullName": "John Doe Jr.",
  "phone": "+1234567890",
  "defaultCurrency": "EUR",
  "timezone": "America/New_York",
  "notificationPreferences": {
    "push": true,
    "email": true,
    "sms": false,
    "whatsapp": false
  },
  "theme": "dark"
}
```

#### Change Password
```http
POST /users/me/change-password
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

#### Setup Biometric
```http
POST /users/me/biometric/setup
```

#### Disable Biometric
```http
DELETE /users/me/biometric
```

---

### 9. Search

#### Global Search
```http
GET /search?q=alice&type=loans,payments
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "loans": [ ... ],
    "payments": [ ... ],
    "totalResults": 15
  }
}
```

---

### 10. Notifications

#### Get Notifications
```http
GET /notifications?unreadOnly=true&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "payment_due",
        "title": "Payment Due Tomorrow",
        "message": "EMI of $886.18 due tomorrow for loan to Alice Smith",
        "isRead": false,
        "createdAt": "2026-01-20T10:30:00Z",
        "actionUrl": "/loans/loan_uuid"
      }
    ],
    "unreadCount": 5
  }
}
```

#### Mark as Read
```http
PUT /notifications/:notificationId/read
```

#### Mark All as Read
```http
PUT /notifications/read-all
```

---

## Webhook Events

LoanLog can send webhook notifications for important events:

### Event Types
- `loan.created`
- `loan.updated`
- `loan.deleted`
- `payment.received`
- `payment.failed`
- `loan.overdue`
- `loan.fully_paid`

### Webhook Payload
```json
{
  "event": "payment.received",
  "timestamp": "2026-01-20T10:30:00Z",
  "data": {
    "loanId": "uuid",
    "paymentId": "uuid",
    "amount": 886.18
  }
}
```

---

## Rate Limiting

API requests are rate-limited per user:
- **Free Tier**: 100 requests/hour
- **Premium**: 1000 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642680000
```

---

## Pagination

All list endpoints support pagination:
```
?page=1&limit=10
```

Response includes pagination metadata:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 48,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Token expired |
| `AUTH_003` | Token invalid |
| `USER_001` | User not found |
| `USER_002` | Email already exists |
| `LOAN_001` | Loan not found |
| `LOAN_002` | Invalid loan data |
| `LOAN_003` | Cannot delete loan with payments |
| `PAYMENT_001` | Payment exceeds outstanding balance |
| `PAYMENT_002` | Invalid payment date |
| `FILE_001` | File too large (max 10MB) |
| `FILE_002` | Invalid file type |
| `RATE_LIMIT` | Too many requests |

---

## API Versioning

API uses URL versioning: `/api/v1/`, `/api/v2/`

Deprecation notices will be sent via:
- Response header: `X-API-Deprecation: true`
- Response header: `X-API-Sunset: 2027-01-01`
