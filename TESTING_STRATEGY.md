# LoanLog - Testing Strategy

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [API Testing](#api-testing)
6. [Mobile Testing](#mobile-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Test Coverage](#test-coverage)

---

## Testing Overview

### Testing Pyramid

```
           /\
          /E2E\         <- 10% (Critical user flows)
         /------\
        /Integration\   <- 30% (API & service integration)
       /------------\
      /  Unit Tests  \  <- 60% (Core logic & calculations)
     /________________\
```

### Testing Tools

- **Unit Tests**: Jest
- **Integration Tests**: Jest + Supertest
- **E2E Tests**: Detox (Mobile), Cypress (Web)
- **API Tests**: Postman + Newman
- **Load Tests**: Artillery, k6
- **Security Tests**: OWASP ZAP, Snyk

---

## Unit Testing

### Backend Unit Tests

#### Interest Calculator Tests

Create `backend/tests/utils/interestCalculator.test.js`:

```javascript
const {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateTotalAmountDue,
  calculateAccruedInterest,
  calculatePaymentBreakdown
} = require('../../src/utils/calculations/interestCalculator');

describe('Interest Calculator', () => {
  describe('Simple Interest', () => {
    test('should calculate simple interest correctly', () => {
      const principal = 10000;
      const rate = 12;
      const days = 365;

      const interest = calculateSimpleInterest(principal, rate, days);

      expect(interest).toBe(1200.00);
    });

    test('should handle zero interest rate', () => {
      const interest = calculateSimpleInterest(10000, 0, 365);
      expect(interest).toBe(0);
    });

    test('should throw error for negative principal', () => {
      expect(() => {
        calculateSimpleInterest(-1000, 12, 365);
      }).toThrow('Invalid input');
    });

    test('should calculate pro-rata interest for partial year', () => {
      const principal = 10000;
      const rate = 12;
      const days = 182; // ~6 months

      const interest = calculateSimpleInterest(principal, rate, days);

      expect(interest).toBeCloseTo(597.53, 2);
    });
  });

  describe('Compound Interest', () => {
    test('should calculate monthly compound interest correctly', () => {
      const principal = 10000;
      const rate = 12;
      const days = 365;
      const frequency = 'monthly';

      const result = calculateCompoundInterest(principal, rate, days, frequency);

      expect(result.totalAmount).toBeCloseTo(11268.25, 2);
      expect(result.interestAmount).toBeCloseTo(1268.25, 2);
    });

    test('should calculate daily compound interest', () => {
      const principal = 10000;
      const rate = 12;
      const days = 365;
      const frequency = 'daily';

      const result = calculateCompoundInterest(principal, rate, days, frequency);

      expect(result.totalAmount).toBeGreaterThan(11268.25);
      expect(result.interestAmount).toBeGreaterThan(1268.25);
    });

    test('should handle different compounding frequencies', () => {
      const principal = 10000;
      const rate = 12;
      const days = 365;

      const daily = calculateCompoundInterest(principal, rate, days, 'daily');
      const monthly = calculateCompoundInterest(principal, rate, days, 'monthly');
      const yearly = calculateCompoundInterest(principal, rate, days, 'yearly');

      expect(daily.interestAmount).toBeGreaterThan(monthly.interestAmount);
      expect(monthly.interestAmount).toBeGreaterThan(yearly.interestAmount);
    });
  });

  describe('Total Amount Due', () => {
    test('should calculate total with simple interest', () => {
      const loanDetails = {
        principalAmount: 10000,
        interestRate: 12,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date('2027-01-01'),
        interestType: 'simple'
      };

      const result = calculateTotalAmountDue(loanDetails);

      expect(result.totalAmountDue).toBe(11200.00);
      expect(result.interestAmount).toBe(1200.00);
    });

    test('should handle no interest', () => {
      const loanDetails = {
        principalAmount: 10000,
        interestRate: 0,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date('2027-01-01'),
        interestType: 'none'
      };

      const result = calculateTotalAmountDue(loanDetails);

      expect(result.totalAmountDue).toBe(10000);
      expect(result.interestAmount).toBe(0);
    });
  });

  describe('Payment Breakdown', () => {
    test('should allocate payment to interest first', () => {
      const paymentAmount = 1000;
      const accruedInterest = 500;
      const outstandingPrincipal = 10000;

      const breakdown = calculatePaymentBreakdown(
        paymentAmount,
        accruedInterest,
        outstandingPrincipal
      );

      expect(breakdown.interestPortion).toBe(500);
      expect(breakdown.principalPortion).toBe(500);
    });

    test('should handle payment less than accrued interest', () => {
      const breakdown = calculatePaymentBreakdown(300, 500, 10000);

      expect(breakdown.interestPortion).toBe(300);
      expect(breakdown.principalPortion).toBe(0);
    });

    test('should not exceed outstanding principal', () => {
      const breakdown = calculatePaymentBreakdown(15000, 500, 10000);

      expect(breakdown.interestPortion).toBe(500);
      expect(breakdown.principalPortion).toBe(10000);
    });
  });
});
```

#### EMI Calculator Tests

Create `backend/tests/utils/emiCalculator.test.js`:

```javascript
const {
  calculateEMI,
  calculateNumberOfInstallments,
  generateAmortizationSchedule,
  calculatePrepaymentEffect
} = require('../../src/utils/calculations/emiCalculator');

describe('EMI Calculator', () => {
  describe('EMI Calculation', () => {
    test('should calculate EMI for monthly payments', () => {
      const principal = 100000;
      const rate = 12;
      const installments = 12;
      const frequency = 'monthly';

      const emi = calculateEMI(principal, rate, installments, frequency);

      expect(emi).toBeCloseTo(8884.88, 2);
    });

    test('should calculate EMI with zero interest', () => {
      const emi = calculateEMI(12000, 0, 12, 'monthly');

      expect(emi).toBe(1000.00);
    });

    test('should calculate EMI for different frequencies', () => {
      const principal = 100000;
      const rate = 12;
      const installments = 52; // weekly

      const weeklyEMI = calculateEMI(principal, rate, installments, 'weekly');

      expect(weeklyEMI).toBeGreaterThan(0);
      expect(weeklyEMI).toBeLessThan(3000);
    });
  });

  describe('Amortization Schedule', () => {
    test('should generate complete schedule', () => {
      const loanDetails = {
        principal: 100000,
        annualInterestRate: 12,
        numberOfInstallments: 12,
        paymentFrequency: 'monthly',
        firstPaymentDate: new Date('2026-02-01')
      };

      const schedule = generateAmortizationSchedule(loanDetails);

      expect(schedule).toHaveLength(12);
      expect(schedule[0].installmentNumber).toBe(1);
      expect(schedule[11].installmentNumber).toBe(12);
      expect(schedule[11].remainingBalance).toBe(0);
    });

    test('should have decreasing interest and increasing principal', () => {
      const loanDetails = {
        principal: 100000,
        annualInterestRate: 12,
        numberOfInstallments: 12,
        paymentFrequency: 'monthly',
        firstPaymentDate: new Date('2026-02-01')
      };

      const schedule = generateAmortizationSchedule(loanDetails);

      expect(schedule[0].interestComponent)
        .toBeGreaterThan(schedule[11].interestComponent);
      expect(schedule[0].principalComponent)
        .toBeLessThan(schedule[11].principalComponent);
    });
  });

  describe('Number of Installments', () => {
    test('should calculate tenure from EMI', () => {
      const principal = 100000;
      const emi = 10000;
      const rate = 12;

      const installments = calculateNumberOfInstallments(
        principal,
        emi,
        rate,
        'monthly'
      );

      expect(installments).toBeGreaterThan(10);
      expect(installments).toBeLessThan(15);
    });

    test('should throw error if EMI too low', () => {
      expect(() => {
        calculateNumberOfInstallments(100000, 500, 12, 'monthly');
      }).toThrow('EMI amount is too low');
    });
  });

  describe('Prepayment Effect', () => {
    test('should reduce tenure with prepayment', () => {
      const loanDetails = {
        principal: 100000,
        annualInterestRate: 12,
        numberOfInstallments: 12,
        paymentFrequency: 'monthly',
        currentBalance: 80000,
        completedInstallments: 3
      };

      const result = calculatePrepaymentEffect(
        loanDetails,
        20000,
        'reduce_tenure'
      );

      expect(result.newTenure).toBeLessThan(9);
      expect(result.interestSaved).toBeGreaterThan(0);
    });

    test('should reduce EMI with prepayment', () => {
      const loanDetails = {
        principal: 100000,
        annualInterestRate: 12,
        numberOfInstallments: 12,
        paymentFrequency: 'monthly',
        currentBalance: 80000,
        completedInstallments: 3
      };

      const result = calculatePrepaymentEffect(
        loanDetails,
        20000,
        'reduce_emi'
      );

      expect(result.newEMI).toBeLessThan(result.originalEMI);
      expect(result.interestSaved).toBeGreaterThan(0);
    });
  });
});
```

### Run Unit Tests

```bash
cd backend
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Specific test file
npm test -- interestCalculator.test.js
```

---

## Integration Testing

### API Integration Tests

Create `backend/tests/integration/loans.test.js`:

```javascript
const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, Loan } = require('../../src/models');

describe('Loan API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      fullName: 'Test User'
    });

    userId = user.id;

    // Get auth token (mock for testing)
    authToken = 'test-jwt-token';
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/loans', () => {
    test('should create a new loan', async () => {
      const loanData = {
        loanType: 'given',
        counterpartyName: 'John Doe',
        principalAmount: 10000,
        currency: 'USD',
        issueDate: '2026-01-20',
        dueDate: '2027-01-20',
        interestRate: 12,
        interestType: 'compound',
        compoundFrequency: 'monthly',
        numberOfInstallments: 12,
        paymentFrequency: 'monthly'
      };

      const response = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send(loanData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.loan).toHaveProperty('id');
      expect(response.body.data.loan.principalAmount).toBe('10000.00');
      expect(response.body.data.amortizationSchedule).toHaveLength(12);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/loans', () => {
    test('should return all loans for user', async () => {
      const response = await request(app)
        .get('/api/v1/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.loans).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should filter by loan type', async () => {
      const response = await request(app)
        .get('/api/v1/loans?type=given')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.loans.every(l => l.loanType === 'given')).toBe(true);
    });
  });

  describe('GET /api/v1/loans/:loanId', () => {
    let loanId;

    beforeAll(async () => {
      const loan = await Loan.create({
        userId,
        loanType: 'given',
        counterpartyName: 'Jane Doe',
        principalAmount: 5000,
        issueDate: '2026-01-20',
        totalAmountDue: 5600,
        outstandingBalance: 5600
      });
      loanId = loan.id;
    });

    test('should return loan details', async () => {
      const response = await request(app)
        .get(`/api/v1/loans/${loanId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.loan.id).toBe(loanId);
    });

    test('should return 404 for non-existent loan', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app)
        .get(`/api/v1/loans/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

---

## End-to-End Testing

### Mobile E2E Tests (Detox)

Create `mobile/e2e/loan-creation.test.js`:

```javascript
describe('Loan Creation Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show dashboard screen', async () => {
    await expect(element(by.text('LoanLog'))).toBeVisible();
    await expect(element(by.text('+ Add Loan'))).toBeVisible();
  });

  it('should navigate to loan creation screen', async () => {
    await element(by.text('+ Add Loan')).tap();
    await expect(element(by.text('Create New Loan'))).toBeVisible();
  });

  it('should create a new loan successfully', async () => {
    await element(by.text('+ Add Loan')).tap();

    // Fill loan details
    await element(by.id('loanTypeDropdown')).tap();
    await element(by.text('Lent')).tap();

    await element(by.id('counterpartyNameInput')).typeText('John Doe');
    await element(by.id('principalAmountInput')).typeText('10000');
    await element(by.id('interestRateInput')).typeText('12');

    // Submit
    await element(by.id('createLoanButton')).tap();

    // Verify success
    await expect(element(by.text('Loan created successfully'))).toBeVisible();
    await expect(element(by.text('John Doe'))).toBeVisible();
  });

  it('should show validation errors', async () => {
    await element(by.text('+ Add Loan')).tap();
    await element(by.id('createLoanButton')).tap();

    await expect(element(by.text('Counterparty name is required'))).toBeVisible();
    await expect(element(by.text('Principal amount is required'))).toBeVisible();
  });
});
```

---

## API Testing

### Postman Collection

Create `postman/loanlog-api.json` with comprehensive test cases:

```json
{
  "info": {
    "name": "LoanLog API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"fullName\":\"Test User\"}"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status is 201\", () => pm.response.to.have.status(201));",
                  "pm.test(\"Returns access token\", () => {",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.data.tokens.accessToken).to.exist;",
                  "  pm.environment.set('accessToken', json.data.tokens.accessToken);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Run with Newman:
```bash
newman run postman/loanlog-api.json -e postman/environment.json
```

---

## Performance Testing

### Load Testing with Artillery

Create `performance/load-test.yml`:

```yaml
config:
  target: 'https://api.loanlog.app'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load
    - duration: 60
      arrivalRate: 100
      name: Peak load

scenarios:
  - name: "Loan CRUD Operations"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.data.tokens.accessToken"
              as: "token"
      - get:
          url: "/api/v1/loans"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/api/v1/loans"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            loanType: "given"
            counterpartyName: "Test User"
            principalAmount: 10000
            issueDate: "2026-01-20"
```

Run load test:
```bash
artillery run performance/load-test.yml
```

---

## Security Testing

### 1. OWASP ZAP Scanning

```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.loanlog.app \
  -r security-report.html
```

### 2. Dependency Vulnerability Scanning

```bash
# Using npm audit
npm audit

# Using Snyk
npx snyk test

# Using OWASP Dependency Check
dependency-check --project LoanLog --scan .
```

### 3. SQL Injection Testing

```javascript
describe('Security Tests', () => {
  test('should prevent SQL injection in search', async () => {
    const maliciousQuery = "'; DROP TABLE loans; --";

    const response = await request(app)
      .get(`/api/v1/loans?search=${encodeURIComponent(maliciousQuery)}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).not.toBe(500);
  });
});
```

---

## Test Coverage

### Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: > 70% coverage
- **Critical Paths**: 100% coverage

### Generate Coverage Report

```bash
npm test -- --coverage --coverageReporters=html

# View report
open coverage/index.html
```

### CI/CD Coverage Check

```yaml
# .github/workflows/test.yml
- name: Test with coverage
  run: npm test -- --coverage
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
```

---

## Best Practices

1. **Write tests before code** (TDD approach)
2. **Keep tests isolated** (no dependencies between tests)
3. **Use descriptive test names**
4. **Test edge cases and error conditions**
5. **Mock external dependencies**
6. **Run tests in CI/CD pipeline**
7. **Maintain test coverage above 80%**
8. **Review test failures immediately**
