/**
 * Interest Calculator Module
 * Handles all interest calculations for LoanLog
 * Supports: Simple Interest, Compound Interest with various frequencies
 */

/**
 * Calculate Simple Interest
 * Formula: SI = (P × R × T) / 100
 *
 * @param {number} principal - Principal amount
 * @param {number} ratePerAnnum - Annual interest rate (percentage)
 * @param {number} timeInDays - Time period in days
 * @returns {number} Simple interest amount
 */
function calculateSimpleInterest(principal, ratePerAnnum, timeInDays) {
  if (principal <= 0 || ratePerAnnum < 0 || timeInDays < 0) {
    throw new Error('Invalid input: principal must be positive, rate and time must be non-negative');
  }

  const timeInYears = timeInDays / 365;
  const interest = (principal * ratePerAnnum * timeInYears) / 100;

  return parseFloat(interest.toFixed(2));
}

/**
 * Calculate Compound Interest
 * Formula: A = P(1 + r/n)^(nt)
 * Where:
 *   A = Final amount
 *   P = Principal
 *   r = Annual interest rate (decimal)
 *   n = Compounding frequency per year
 *   t = Time in years
 *
 * @param {number} principal - Principal amount
 * @param {number} ratePerAnnum - Annual interest rate (percentage)
 * @param {number} timeInDays - Time period in days
 * @param {string} compoundFrequency - 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
 * @returns {object} { totalAmount, interestAmount }
 */
function calculateCompoundInterest(principal, ratePerAnnum, timeInDays, compoundFrequency = 'monthly') {
  if (principal <= 0 || ratePerAnnum < 0 || timeInDays < 0) {
    throw new Error('Invalid input: principal must be positive, rate and time must be non-negative');
  }

  // Convert annual rate to decimal
  const rateDecimal = ratePerAnnum / 100;

  // Time in years
  const timeInYears = timeInDays / 365;

  // Compounding frequency per year
  const frequencyMap = {
    daily: 365,
    weekly: 52,
    biweekly: 26,
    monthly: 12,
    quarterly: 4,
    yearly: 1
  };

  const n = frequencyMap[compoundFrequency] || 12;

  // Calculate compound interest
  const totalAmount = principal * Math.pow((1 + rateDecimal / n), n * timeInYears);
  const interestAmount = totalAmount - principal;

  return {
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    interestAmount: parseFloat(interestAmount.toFixed(2))
  };
}

/**
 * Calculate interest for a specific period (used for interest logs)
 *
 * @param {number} principal - Principal amount
 * @param {number} ratePerAnnum - Annual interest rate (percentage)
 * @param {Date} startDate - Period start date
 * @param {Date} endDate - Period end date
 * @param {string} interestType - 'simple' or 'compound'
 * @param {string} compoundFrequency - Compounding frequency (for compound interest)
 * @returns {number} Interest for the period
 */
function calculatePeriodInterest(principal, ratePerAnnum, startDate, endDate, interestType = 'simple', compoundFrequency = 'monthly') {
  const timeInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  if (timeInDays <= 0) {
    return 0;
  }

  if (interestType === 'simple') {
    return calculateSimpleInterest(principal, ratePerAnnum, timeInDays);
  } else if (interestType === 'compound') {
    const { interestAmount } = calculateCompoundInterest(principal, ratePerAnnum, timeInDays, compoundFrequency);
    return interestAmount;
  } else {
    return 0;
  }
}

/**
 * Calculate total amount due (principal + interest) for a loan
 *
 * @param {object} loanDetails - Loan details
 * @param {number} loanDetails.principalAmount - Principal amount
 * @param {number} loanDetails.interestRate - Annual interest rate (percentage)
 * @param {Date} loanDetails.issueDate - Loan issue date
 * @param {Date} loanDetails.dueDate - Loan due date
 * @param {string} loanDetails.interestType - 'simple', 'compound', or 'none'
 * @param {string} loanDetails.compoundFrequency - Compounding frequency
 * @returns {object} { totalAmountDue, interestAmount }
 */
function calculateTotalAmountDue(loanDetails) {
  const {
    principalAmount,
    interestRate,
    issueDate,
    dueDate,
    interestType,
    compoundFrequency
  } = loanDetails;

  if (interestType === 'none' || !interestRate || interestRate === 0) {
    return {
      totalAmountDue: principalAmount,
      interestAmount: 0
    };
  }

  const timeInDays = Math.ceil((dueDate - issueDate) / (1000 * 60 * 60 * 24));

  let interestAmount = 0;

  if (interestType === 'simple') {
    interestAmount = calculateSimpleInterest(principalAmount, interestRate, timeInDays);
  } else if (interestType === 'compound') {
    const result = calculateCompoundInterest(principalAmount, interestRate, timeInDays, compoundFrequency);
    interestAmount = result.interestAmount;
  }

  return {
    totalAmountDue: parseFloat((principalAmount + interestAmount).toFixed(2)),
    interestAmount: parseFloat(interestAmount.toFixed(2))
  };
}

/**
 * Calculate interest accrued up to current date (for partial payments)
 * This is useful when calculating how much interest has accrued so far
 *
 * @param {object} loanDetails - Loan details
 * @param {number} loanDetails.principalAmount - Current principal balance
 * @param {number} loanDetails.interestRate - Annual interest rate (percentage)
 * @param {Date} loanDetails.lastCalculationDate - Last date interest was calculated
 * @param {Date} currentDate - Current date (defaults to today)
 * @param {string} loanDetails.interestType - 'simple' or 'compound'
 * @param {string} loanDetails.compoundFrequency - Compounding frequency
 * @returns {number} Interest accrued
 */
function calculateAccruedInterest(loanDetails, currentDate = new Date()) {
  const {
    principalAmount,
    interestRate,
    lastCalculationDate,
    interestType,
    compoundFrequency
  } = loanDetails;

  return calculatePeriodInterest(
    principalAmount,
    interestRate,
    lastCalculationDate,
    currentDate,
    interestType,
    compoundFrequency
  );
}

/**
 * Calculate payment breakdown (principal vs interest portions)
 * Used when a payment is made to determine how much goes to principal and interest
 *
 * @param {number} paymentAmount - Amount being paid
 * @param {number} accruedInterest - Interest accrued so far
 * @param {number} outstandingPrincipal - Outstanding principal balance
 * @returns {object} { principalPortion, interestPortion }
 */
function calculatePaymentBreakdown(paymentAmount, accruedInterest, outstandingPrincipal) {
  let interestPortion = Math.min(paymentAmount, accruedInterest);
  let principalPortion = Math.max(0, paymentAmount - interestPortion);

  // If payment exceeds total due, cap principal portion
  if (principalPortion > outstandingPrincipal) {
    principalPortion = outstandingPrincipal;
  }

  return {
    principalPortion: parseFloat(principalPortion.toFixed(2)),
    interestPortion: parseFloat(interestPortion.toFixed(2))
  };
}

/**
 * Calculate daily interest rate (for daily accrual tracking)
 *
 * @param {number} annualRate - Annual interest rate (percentage)
 * @param {string} compoundingBasis - 'simple' or 'compound'
 * @returns {number} Daily interest rate
 */
function calculateDailyRate(annualRate, compoundingBasis = 'simple') {
  if (compoundingBasis === 'simple') {
    return annualRate / 365 / 100;
  } else {
    // For compound, use effective daily rate
    return Math.pow(1 + annualRate / 100, 1 / 365) - 1;
  }
}

/**
 * Generate interest accrual schedule
 * Useful for showing interest accumulation over time
 *
 * @param {object} loanDetails - Loan details
 * @param {number} loanDetails.principalAmount - Principal amount
 * @param {number} loanDetails.interestRate - Annual interest rate
 * @param {Date} loanDetails.issueDate - Loan issue date
 * @param {Date} loanDetails.dueDate - Loan due date
 * @param {string} loanDetails.interestType - Interest type
 * @param {string} loanDetails.compoundFrequency - Compounding frequency
 * @param {string} scheduleFrequency - 'daily', 'weekly', 'monthly'
 * @returns {array} Array of { date, principalBalance, interestAccrued, cumulativeInterest, totalBalance }
 */
function generateInterestSchedule(loanDetails, scheduleFrequency = 'monthly') {
  const {
    principalAmount,
    interestRate,
    issueDate,
    dueDate,
    interestType,
    compoundFrequency
  } = loanDetails;

  if (interestType === 'none' || !interestRate || interestRate === 0) {
    return [{
      date: dueDate,
      principalBalance: principalAmount,
      interestAccrued: 0,
      cumulativeInterest: 0,
      totalBalance: principalAmount
    }];
  }

  const schedule = [];
  const frequencyDaysMap = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    quarterly: 90
  };

  const incrementDays = frequencyDaysMap[scheduleFrequency] || 30;
  let currentDate = new Date(issueDate);
  let cumulativeInterest = 0;

  while (currentDate <= dueDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + incrementDays);

    const endDate = nextDate > dueDate ? dueDate : nextDate;
    const periodInterest = calculatePeriodInterest(
      principalAmount,
      interestRate,
      currentDate,
      endDate,
      interestType,
      compoundFrequency
    );

    cumulativeInterest += periodInterest;

    schedule.push({
      date: new Date(endDate),
      principalBalance: principalAmount,
      interestAccrued: parseFloat(periodInterest.toFixed(2)),
      cumulativeInterest: parseFloat(cumulativeInterest.toFixed(2)),
      totalBalance: parseFloat((principalAmount + cumulativeInterest).toFixed(2))
    });

    currentDate = nextDate;

    if (currentDate >= dueDate) break;
  }

  return schedule;
}

module.exports = {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculatePeriodInterest,
  calculateTotalAmountDue,
  calculateAccruedInterest,
  calculatePaymentBreakdown,
  calculateDailyRate,
  generateInterestSchedule
};
