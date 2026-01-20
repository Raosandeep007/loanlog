/**
 * EMI Calculator Module
 * Handles EMI calculations for various payment frequencies
 * Supports: Monthly, Weekly, Daily, Custom intervals
 */

const { calculateCompoundInterest, calculateSimpleInterest } = require('./interestCalculator');

/**
 * Calculate EMI for reducing balance loans
 * Formula: EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1]
 * Where:
 *   P = Principal loan amount
 *   r = Interest rate per period
 *   n = Number of periods
 *
 * @param {number} principal - Principal loan amount
 * @param {number} annualInterestRate - Annual interest rate (percentage)
 * @param {number} numberOfInstallments - Total number of installments
 * @param {string} paymentFrequency - 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
 * @returns {number} EMI amount per installment
 */
function calculateEMI(principal, annualInterestRate, numberOfInstallments, paymentFrequency = 'monthly') {
  if (principal <= 0) {
    throw new Error('Principal must be positive');
  }

  if (numberOfInstallments <= 0) {
    throw new Error('Number of installments must be positive');
  }

  // If no interest, simply divide principal by number of installments
  if (!annualInterestRate || annualInterestRate === 0) {
    return parseFloat((principal / numberOfInstallments).toFixed(2));
  }

  // Convert annual rate to period rate
  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const ratePerPeriod = (annualInterestRate / 100) / periodsPerYear;

  // Calculate EMI using reducing balance formula
  const emi = (principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfInstallments)) /
              (Math.pow(1 + ratePerPeriod, numberOfInstallments) - 1);

  return parseFloat(emi.toFixed(2));
}

/**
 * Calculate total amount to be paid over loan tenure
 *
 * @param {number} emi - EMI amount
 * @param {number} numberOfInstallments - Number of installments
 * @returns {object} { totalAmount, totalInterest, principal }
 */
function calculateTotalPayment(emi, numberOfInstallments, principal) {
  const totalAmount = emi * numberOfInstallments;
  const totalInterest = totalAmount - principal;

  return {
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    principal: parseFloat(principal.toFixed(2))
  };
}

/**
 * Generate complete EMI amortization schedule
 * Shows payment breakdown for each installment
 *
 * @param {object} loanDetails - Loan details
 * @param {number} loanDetails.principal - Principal amount
 * @param {number} loanDetails.annualInterestRate - Annual interest rate
 * @param {number} loanDetails.numberOfInstallments - Number of installments
 * @param {string} loanDetails.paymentFrequency - Payment frequency
 * @param {Date} loanDetails.firstPaymentDate - Date of first payment
 * @returns {array} Amortization schedule
 */
function generateAmortizationSchedule(loanDetails) {
  const {
    principal,
    annualInterestRate,
    numberOfInstallments,
    paymentFrequency,
    firstPaymentDate
  } = loanDetails;

  const emi = calculateEMI(principal, annualInterestRate, numberOfInstallments, paymentFrequency);
  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const ratePerPeriod = annualInterestRate ? (annualInterestRate / 100) / periodsPerYear : 0;

  const schedule = [];
  let remainingBalance = principal;
  let currentDate = new Date(firstPaymentDate);

  for (let installmentNumber = 1; installmentNumber <= numberOfInstallments; installmentNumber++) {
    // Calculate interest for this period
    const interestForPeriod = remainingBalance * ratePerPeriod;

    // Calculate principal for this period
    const principalForPeriod = emi - interestForPeriod;

    // Update remaining balance
    remainingBalance -= principalForPeriod;

    // Handle final installment adjustment (to account for rounding)
    const isLastInstallment = installmentNumber === numberOfInstallments;
    const adjustedPrincipal = isLastInstallment ? principalForPeriod + remainingBalance : principalForPeriod;
    const adjustedEMI = isLastInstallment ? emi + remainingBalance : emi;
    const adjustedBalance = isLastInstallment ? 0 : remainingBalance;

    schedule.push({
      installmentNumber,
      dueDate: new Date(currentDate),
      emiAmount: parseFloat(adjustedEMI.toFixed(2)),
      principalComponent: parseFloat(adjustedPrincipal.toFixed(2)),
      interestComponent: parseFloat(interestForPeriod.toFixed(2)),
      remainingBalance: parseFloat(Math.max(0, adjustedBalance).toFixed(2))
    });

    // Calculate next payment date
    currentDate = getNextPaymentDate(currentDate, paymentFrequency);
  }

  return schedule;
}

/**
 * Calculate number of installments required for a given EMI
 *
 * @param {number} principal - Principal amount
 * @param {number} emiAmount - Desired EMI amount
 * @param {number} annualInterestRate - Annual interest rate
 * @param {string} paymentFrequency - Payment frequency
 * @returns {number} Number of installments
 */
function calculateNumberOfInstallments(principal, emiAmount, annualInterestRate, paymentFrequency = 'monthly') {
  if (emiAmount <= 0 || principal <= 0) {
    throw new Error('EMI and principal must be positive');
  }

  // If no interest
  if (!annualInterestRate || annualInterestRate === 0) {
    return Math.ceil(principal / emiAmount);
  }

  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const ratePerPeriod = (annualInterestRate / 100) / periodsPerYear;

  // Check if EMI is sufficient to cover interest
  const minEMI = principal * ratePerPeriod;
  if (emiAmount <= minEMI) {
    throw new Error('EMI amount is too low to cover interest. Loan will never be repaid.');
  }

  // Calculate number of periods using formula:
  // n = log(EMI / (EMI - P*r)) / log(1 + r)
  const n = Math.log(emiAmount / (emiAmount - principal * ratePerPeriod)) / Math.log(1 + ratePerPeriod);

  return Math.ceil(n);
}

/**
 * Calculate remaining installments and balance after partial payments
 *
 * @param {object} loanDetails - Original loan details
 * @param {array} paymentHistory - Array of payments made
 * @returns {object} Updated loan status
 */
function calculateRemainingLoan(loanDetails, paymentHistory) {
  const {
    principal,
    annualInterestRate,
    numberOfInstallments,
    paymentFrequency,
    firstPaymentDate
  } = loanDetails;

  // Generate original schedule
  const schedule = generateAmortizationSchedule(loanDetails);

  // Track payments
  let totalPaid = 0;
  let principalPaid = 0;
  let interestPaid = 0;

  paymentHistory.forEach(payment => {
    totalPaid += payment.amount;
    principalPaid += payment.principalPortion || 0;
    interestPaid += payment.interestPortion || 0;
  });

  // Find current position in schedule
  let remainingBalance = principal - principalPaid;
  let completedInstallments = paymentHistory.length;
  let remainingInstallments = numberOfInstallments - completedInstallments;

  return {
    originalPrincipal: principal,
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    principalPaid: parseFloat(principalPaid.toFixed(2)),
    interestPaid: parseFloat(interestPaid.toFixed(2)),
    remainingBalance: parseFloat(Math.max(0, remainingBalance).toFixed(2)),
    completedInstallments,
    remainingInstallments: Math.max(0, remainingInstallments),
    nextPaymentDue: remainingInstallments > 0 ? schedule[completedInstallments]?.dueDate : null,
    isFullyPaid: remainingBalance <= 0
  };
}

/**
 * Calculate effect of prepayment on loan
 *
 * @param {object} loanDetails - Current loan details
 * @param {number} prepaymentAmount - Prepayment amount
 * @param {string} prepaymentOption - 'reduce_tenure' or 'reduce_emi'
 * @returns {object} Updated loan details
 */
function calculatePrepaymentEffect(loanDetails, prepaymentAmount, prepaymentOption = 'reduce_tenure') {
  const {
    principal,
    annualInterestRate,
    numberOfInstallments,
    paymentFrequency,
    currentBalance,
    completedInstallments
  } = loanDetails;

  const newPrincipal = currentBalance - prepaymentAmount;

  if (newPrincipal <= 0) {
    return {
      newPrincipal: 0,
      newEMI: 0,
      newTenure: 0,
      interestSaved: currentBalance - prepaymentAmount,
      message: 'Loan will be fully repaid with this prepayment'
    };
  }

  const remainingInstallments = numberOfInstallments - completedInstallments;
  const originalEMI = calculateEMI(principal, annualInterestRate, numberOfInstallments, paymentFrequency);

  let result = {};

  if (prepaymentOption === 'reduce_tenure') {
    // Keep EMI same, reduce tenure
    const newTenure = calculateNumberOfInstallments(newPrincipal, originalEMI, annualInterestRate, paymentFrequency);
    const oldTotalPayment = originalEMI * remainingInstallments;
    const newTotalPayment = originalEMI * newTenure + prepaymentAmount;

    result = {
      newPrincipal: parseFloat(newPrincipal.toFixed(2)),
      newEMI: originalEMI,
      originalTenure: remainingInstallments,
      newTenure,
      tenureReduced: remainingInstallments - newTenure,
      interestSaved: parseFloat((oldTotalPayment - newTotalPayment).toFixed(2))
    };
  } else {
    // Keep tenure same, reduce EMI
    const newEMI = calculateEMI(newPrincipal, annualInterestRate, remainingInstallments, paymentFrequency);
    const oldTotalPayment = originalEMI * remainingInstallments;
    const newTotalPayment = newEMI * remainingInstallments + prepaymentAmount;

    result = {
      newPrincipal: parseFloat(newPrincipal.toFixed(2)),
      originalEMI: originalEMI,
      newEMI: parseFloat(newEMI.toFixed(2)),
      emiReduced: parseFloat((originalEMI - newEMI).toFixed(2)),
      tenure: remainingInstallments,
      interestSaved: parseFloat((oldTotalPayment - newTotalPayment).toFixed(2))
    };
  }

  return result;
}

/**
 * Get number of periods per year for a given frequency
 *
 * @param {string} frequency - Payment frequency
 * @returns {number} Periods per year
 */
function getPeriodsPerYear(frequency) {
  const frequencyMap = {
    daily: 365,
    weekly: 52,
    biweekly: 26,
    monthly: 12,
    quarterly: 4,
    yearly: 1
  };

  return frequencyMap[frequency] || 12;
}

/**
 * Calculate next payment date based on frequency
 *
 * @param {Date} currentDate - Current date
 * @param {string} frequency - Payment frequency
 * @param {number} customDays - Custom interval in days
 * @returns {Date} Next payment date
 */
function getNextPaymentDate(currentDate, frequency, customDays = null) {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'custom':
      if (customDays) {
        nextDate.setDate(nextDate.getDate() + customDays);
      }
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}

/**
 * Calculate loan details from EMI and tenure
 *
 * @param {number} emiAmount - EMI amount
 * @param {number} numberOfInstallments - Number of installments
 * @param {number} annualInterestRate - Annual interest rate
 * @param {string} paymentFrequency - Payment frequency
 * @returns {object} Loan details including principal
 */
function calculatePrincipalFromEMI(emiAmount, numberOfInstallments, annualInterestRate, paymentFrequency = 'monthly') {
  if (!annualInterestRate || annualInterestRate === 0) {
    return {
      principal: emiAmount * numberOfInstallments,
      totalAmount: emiAmount * numberOfInstallments,
      totalInterest: 0
    };
  }

  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const ratePerPeriod = (annualInterestRate / 100) / periodsPerYear;

  // Formula: P = EMI × [(1 + r)^n - 1] / [r × (1 + r)^n]
  const principal = emiAmount * (Math.pow(1 + ratePerPeriod, numberOfInstallments) - 1) /
                   (ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfInstallments));

  const totalAmount = emiAmount * numberOfInstallments;
  const totalInterest = totalAmount - principal;

  return {
    principal: parseFloat(principal.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2))
  };
}

module.exports = {
  calculateEMI,
  calculateTotalPayment,
  generateAmortizationSchedule,
  calculateNumberOfInstallments,
  calculateRemainingLoan,
  calculatePrepaymentEffect,
  getPeriodsPerYear,
  getNextPaymentDate,
  calculatePrincipalFromEMI
};
