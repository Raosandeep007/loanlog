# LoanLog 📊

> A comprehensive loan tracking application for managing loans given to others or taken from others, with flexible repayment schedules and smart analytics.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## ✨ Features

### Core Features
- 📝 **Comprehensive Loan Management**: Track loans given or taken with detailed information
- 💰 **Flexible Payment Schedules**: Support for daily, weekly, monthly, or custom EMI frequencies
- 📈 **Interest Calculations**: Both simple and compound interest with multiple compounding frequencies
- 💳 **Payment Tracking**: Record payments with automatic balance updates and history
- 🔔 **Smart Reminders**: Configurable notifications via Push, Email, SMS, and WhatsApp
- 📊 **Analytics Dashboard**: Visual insights into loans, cash flow, and interest earnings
- 📎 **Attachments**: Store loan agreements, receipts, and bills securely
- 🔍 **Advanced Search & Filter**: Find loans by counterparty, amount, date, or status
- 🌙 **Dark Mode**: Eye-friendly interface with theme support
- 🔒 **Biometric Security**: Secure access with Face ID/Fingerprint

### Advanced Features
- 📅 **Amortization Schedule**: Complete payment schedule with principal/interest breakdown
- 📉 **Prepayment Analysis**: Calculate impact of early payments
- 📊 **Cash Flow Tracking**: Monitor money in/out over time
- 🎯 **Net Position**: Real-time view of receivables vs payables
- ⚠️ **Overdue Alerts**: Automatic status updates for missed payments
- 📄 **Report Generation**: Export data as PDF/Excel
- 🌐 **Multi-Currency**: Support for multiple currencies with conversion
- 📱 **Offline-First**: Work without internet, sync when online

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)                │
│                  iOS & Android | Offline Support             │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Backend API (Node.js + Express)                 │
│          JWT Auth | Business Logic | File Storage           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────┐         ┌────────▼─────────┐
│  PostgreSQL  │         │   AWS S3/Cloud   │
│   Database   │         │  File Storage    │
└──────────────┘         └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14
- Git

### Backend Setup

```bash
# Clone repository
git clone https://github.com/Raosandeep007/loanlog.git
cd loanlog/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
createdb loanlog_dev
npm run migrate

# Start development server
npm run dev
```

Server runs on `http://localhost:3000`

### Mobile App Setup

```bash
cd ../mobile
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

## 📚 Documentation

- [Project Structure](PROJECT_STRUCTURE.md) - Tech stack and directory layout
- [Database Schema](DATABASE_SCHEMA.md) - Complete database design
- [API Specification](API_SPECIFICATION.md) - REST API endpoints
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [Testing Strategy](TESTING_STRATEGY.md) - Comprehensive testing approach

## 🧮 Core Calculations

### Interest Calculation

**Simple Interest**:
```
Interest = (Principal × Rate × Time) / 100
```

**Compound Interest**:
```
Amount = Principal × (1 + Rate/n)^(n×Time)
Interest = Amount - Principal

Where n = compounding frequency per year
```

### EMI Calculation

```
EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1]

Where:
P = Principal loan amount
r = Interest rate per period
n = Number of periods
```

Example usage:

```javascript
const { calculateEMI } = require('./backend/src/utils/calculations/emiCalculator');

const emi = calculateEMI(
  100000,   // Principal: ₹1,00,000
  12,       // Interest rate: 12% per annum
  12,       // Number of installments: 12
  'monthly' // Payment frequency: Monthly
);

console.log(emi); // ₹8,884.88 per month
```

## 🔌 API Examples

### Create a Loan

```bash
curl -X POST https://api.loanlog.app/v1/loans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loanType": "given",
    "counterpartyName": "John Doe",
    "principalAmount": 10000,
    "interestRate": 12,
    "interestType": "compound",
    "compoundFrequency": "monthly",
    "numberOfInstallments": 12,
    "paymentFrequency": "monthly",
    "issueDate": "2026-01-20",
    "dueDate": "2027-01-20"
  }'
```

### Record Payment

```bash
curl -X POST https://api.loanlog.app/v1/loans/{loanId}/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 886.18,
    "paymentDate": "2026-02-20",
    "paymentMethod": "bank_transfer"
  }'
```

### Get Dashboard Summary

```bash
curl https://api.loanlog.app/v1/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- interestCalculator.test.js

# Watch mode
npm test -- --watch
```

## 📦 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 / Google Cloud Storage
- **Scheduling**: node-cron for reminders
- **Testing**: Jest + Supertest

### Mobile
- **Framework**: React Native
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **UI Components**: React Native Paper
- **Charts**: Victory Native
- **Forms**: React Hook Form
- **Notifications**: react-native-push-notification

### DevOps
- **CI/CD**: GitHub Actions
- **Hosting**: Heroku / AWS EC2
- **Monitoring**: Sentry, New Relic
- **Analytics**: Mixpanel
- **Logging**: Winston + ELK Stack

## 🗺️ Roadmap

### Phase 1: MVP (✅ Completed)
- [x] Basic loan CRUD operations
- [x] Payment tracking
- [x] Interest calculations
- [x] Dashboard with summaries
- [x] Local notifications

### Phase 2: Enhanced Features (🚧 In Progress)
- [ ] Cloud backup & sync
- [ ] Report generation (PDF/Excel)
- [ ] Multi-currency support
- [ ] Advanced analytics with charts
- [ ] QR code payment generation
- [ ] Attachment management
- [ ] Dark mode UI

### Phase 3: Advanced Features (📋 Planned)
- [ ] AI-powered repayment suggestions
- [ ] Auto-reminder to borrowers (WhatsApp/SMS)
- [ ] Digital loan agreement templates
- [ ] Multi-user collaboration
- [ ] Expense impact analysis
- [ ] Credit score integration
- [ ] Predictive analytics for defaults

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Development Team** - [LoanLog Team](https://github.com/Raosandeep007)

## 🙏 Acknowledgments

- Interest calculation formulas based on standard financial mathematics
- EMI calculation algorithm from banking industry standards
- UI/UX inspiration from modern fintech applications

## 📞 Support

- **Documentation**: [docs.loanlog.app](https://docs.loanlog.app)
- **Issues**: [GitHub Issues](https://github.com/Raosandeep007/loanlog/issues)
- **Email**: support@loanlog.app
- **Discord**: [Join our community](https://discord.gg/loanlog)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Raosandeep007/loanlog&type=Date)](https://star-history.com/#Raosandeep007/loanlog&Date)

---

<p align="center">Made with ❤️ by the LoanLog Team</p>
<p align="center">
  <a href="https://loanlog.app">Website</a> •
  <a href="https://docs.loanlog.app">Documentation</a> •
  <a href="https://twitter.com/loanlog">Twitter</a>
</p>
