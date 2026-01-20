# LoanLog 📊

> A comprehensive loan tracking mobile application built with Expo, SQLite, and Drizzle ORM. Track loans you've given or taken with flexible repayment schedules and smart analytics - all stored locally on your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Expo](https://img.shields.io/badge/Expo-~51.0.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

### Core Functionality
- 📝 **Comprehensive Loan Tracking**: Manage loans given to others or taken from others
- 💰 **Flexible Payment Schedules**: Daily, weekly, monthly, or custom EMI frequencies
- 📈 **Interest Calculations**: Simple and compound interest with multiple compounding frequencies
- 💳 **Payment Management**: Record payments with automatic balance updates
- 📊 **Beautiful Dashboard**: Real-time insights into loans, cash flow, and net position
- 🎨 **Custom Theme**: Professional light/dark mode with cohesive design system
- 💾 **Offline-First**: All data stored locally in SQLite database
- 🔒 **Secure**: Local database with optional biometric authentication

### Financial Features
- Calculate EMI for any payment frequency
- Generate complete amortization schedules
- Track interest accrual over time
- Analyze prepayment impact
- Support for irregular partial payments

## 🏗️ Architecture

### Monorepo Structure

```
loanlog/
├── app/                          # Expo mobile application
│   ├── app/                      # App Router screens
│   │   ├── _layout.tsx          # Root layout
│   │   ├── index.tsx            # Dashboard screen
│   │   └── loans/               # Loan screens
│   ├── components/              # Reusable UI components
│   ├── src/                     # Backend logic (shared)
│   │   ├── db/                  # Database setup
│   │   │   ├── schema.ts        # Drizzle ORM schema
│   │   │   └── client.ts        # Database client
│   │   ├── services/            # Business logic
│   │   │   ├── loanService.ts   # Loan operations
│   │   │   └── paymentService.ts # Payment operations
│   │   └── utils/               # Utilities
│   │       ├── interestCalculator.ts
│   │       ├── emiCalculator.ts
│   │       └── formatters.ts
│   ├── drizzle/                 # Database migrations
│   ├── global.css               # NativeWind styles
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── drizzle.config.ts        # Drizzle configuration
│   └── package.json             # App dependencies
├── package.json                 # Root workspace config
└── README.md                    # This file
```

### Technology Stack

**Frontend**
- **Expo SDK 51**: Cross-platform mobile framework
- **Expo Router**: File-based routing
- **React Native**: Mobile UI framework
- **NativeWind v4**: Tailwind CSS for React Native
- **TypeScript**: Type safety

**Backend/Database**
- **Expo SQLite**: Local database
- **Drizzle ORM**: Type-safe database operations
- **Zustand** (optional): State management

**Styling**
- **NativeWind**: Utility-first styling
- **Custom Theme**: Professional design system with light/dark modes

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Raosandeep007/loanlog.git
cd loanlog
```

2. **Install dependencies**
```bash
npm install
cd app
npm install
```

3. **Initialize database**
```bash
npm run db:generate
```

4. **Start Expo development server**
```bash
npm start
# or
npm run app
```

5. **Run on your device**
```bash
# iOS
npm run app:ios

# Android
npm run app:android

# Web
npm run app:web
```

## 📱 Screens

### Dashboard
- Net position (receivables - payables)
- Total lent and borrowed amounts
- Overdue alerts
- Quick stats
- Quick actions

### Loans List
- Filter by all/lent/borrowed
- Beautiful loan cards with status indicators
- Progress bars showing payment status
- Pull to refresh

### Loan Detail *(Coming Soon)*
- Full loan information
- Amortization schedule
- Payment history
- Add payment functionality

### Create Loan *(Coming Soon)*
- Comprehensive loan entry form
- Real-time EMI calculation preview
- Interest calculation options
- Custom payment schedules

## 🧮 Financial Calculations

### Interest Calculation

**Simple Interest**:
```typescript
Interest = (Principal × Rate × Time) / 100
```

**Compound Interest**:
```typescript
Amount = Principal × (1 + Rate/n)^(n×Time)
Interest = Amount - Principal

Where n = compounding frequency per year
```

Example usage:
```typescript
import { calculateTotalAmountDue } from './src/utils/interestCalculator';

const { totalAmountDue, interestAmount } = calculateTotalAmountDue({
  principalAmount: 100000,
  interestRate: 12,
  issueDate: new Date('2026-01-01'),
  dueDate: new Date('2027-01-01'),
  interestType: 'compound',
  compoundFrequency: 'monthly',
});

console.log(totalAmountDue); // ₹112,682.50
console.log(interestAmount);  // ₹12,682.50
```

### EMI Calculation

```typescript
EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1]

Where:
P = Principal loan amount
r = Interest rate per period
n = Number of periods
```

Example usage:
```typescript
import { calculateEMI } from './src/utils/emiCalculator';

const emi = calculateEMI(
  100000,   // Principal: ₹1,00,000
  12,       // Interest rate: 12% per annum
  12,       // Number of installments: 12
  'monthly' // Payment frequency: Monthly
);

console.log(emi); // ₹8,884.88 per month
```

## 🗄️ Database Schema

### Tables

**users**
- id, email, fullName, phone
- Preferences: defaultCurrency, theme, biometricEnabled
- notificationPreferences (JSON)

**loans**
- Basic info: id, userId, loanType (given/taken)
- Counterparty: name, phone, email, address
- Loan details: principalAmount, currency, issueDate, dueDate
- Interest: interestRate, interestType, compoundFrequency
- Payment schedule: paymentFrequency, numberOfInstallments, emiAmount
- Calculated: totalAmountDue, totalPaid, outstandingBalance
- Status: active, partially_paid, fully_paid, overdue, written_off

**payments**
- id, loanId, amount, paymentDate, paymentMethod
- Breakdown: principalPortion, interestPortion
- balanceAfterPayment, status, notes

**attachments**
- id, loanId, paymentId
- File info: fileName, fileType, fileUri
- attachmentType: agreement, receipt, bill, proof

**reminders**
- id, loanId, userId
- reminderDate, reminderChannel, message
- status: scheduled, sent, failed, cancelled

**interestLog**
- Track interest accrual over time
- calculationDate, principalBalance, interestAccrued

## 🎨 Theme System

The app uses a custom design system with comprehensive light and dark modes:

```javascript
// Light mode colors
--primary: #0152cb (Primary blue)
--secondary: #dee2f1 (Light gray)
--accent: #e7effc (Accent blue)
--destructive: #df2224 (Red)
--background: #edf0f9 (Light background)

// Dark mode colors
--primary: #0265fd (Bright blue)
--background: #1c2433 (Dark background)
--card: #313a46 (Dark card)
```

Use with NativeWind:
```tsx
<View className="bg-primary p-4 rounded-lg">
  <Text className="text-primary-foreground font-bold">
    Primary Button
  </Text>
</View>
```

## 📖 API Examples

### Create a Loan

```typescript
import { LoanService } from './src/services/loanService';

const loan = await LoanService.createLoan({
  userId: 'user-id',
  loanType: 'given',
  counterpartyName: 'John Doe',
  principalAmount: 10000,
  currency: 'USD',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  interestRate: 12,
  interestType: 'compound',
  compoundFrequency: 'monthly',
  numberOfInstallments: 12,
  paymentFrequency: 'monthly',
});
```

### Record a Payment

```typescript
import { PaymentService } from './src/services/paymentService';

const { payment, updatedLoan } = await PaymentService.recordPayment({
  loanId: 'loan-id',
  amount: 886.18,
  paymentDate: new Date(),
  paymentMethod: 'bank_transfer',
  status: 'completed',
});
```

### Get Dashboard Summary

```typescript
import { LoanService } from './src/services/loanService';

const summary = await LoanService.getDashboardSummary('user-id');

console.log(summary.netPosition);       // ₹5,000
console.log(summary.loansGiven.count);  // 3
console.log(summary.overdue.amount);    // ₹1,200
```

## 🧪 Development

### Database Operations

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Completed)
- [x] Database schema with Drizzle ORM
- [x] Interest & EMI calculation utilities
- [x] Loan and payment services
- [x] Dashboard screen
- [x] Loans list screen
- [x] NativeWind theming

### 🚧 Phase 2: Core Features (In Progress)
- [ ] Create loan form
- [ ] Loan detail screen
- [ ] Payment recording
- [ ] Amortization schedule view
- [ ] User authentication
- [ ] Biometric security

### 📋 Phase 3: Enhanced Features (Planned)
- [ ] Data export (PDF/Excel)
- [ ] Backup & restore
- [ ] Charts & visualizations
- [ ] Reminders & notifications
- [ ] Multi-currency support
- [ ] Attachment management
- [ ] Search functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **LoanLog Team** - [Raosandeep007](https://github.com/Raosandeep007)

## 🙏 Acknowledgments

- Interest calculation formulas based on standard financial mathematics
- EMI calculation algorithm from banking industry standards
- UI/UX inspiration from modern fintech applications
- Theme design system from shadcn/ui

---

<p align="center">Made with ❤️ using Expo and Drizzle ORM</p>
