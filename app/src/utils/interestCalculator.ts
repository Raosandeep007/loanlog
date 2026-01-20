/**
 * Interest Calculator Utilities
 * Handles all interest calculations for LoanLog
 */

export type InterestType = 'simple' | 'compound' | 'none';
export type CompoundFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Calculate Simple Interest
 * Formula: SI = (P × R × T) / 100
 */
export function calculateSimpleInterest(
  principal: number,
  ratePerAnnum: number,
  timeInDays: number
): number {
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
 */
export function calculateCompoundInterest(
  principal: number,
  ratePerAnnum: number,
  timeInDays: number,
  compoundFrequency: CompoundFrequency = 'monthly'
): { totalAmount: number; interestAmount: number } {
  if (principal <= 0 || ratePerAnnum < 0 || timeInDays < 0) {
    throw new Error('Invalid input: principal must be positive, rate and time must be non-negative');
  }

  const rateDecimal = ratePerAnnum / 100;
  const timeInYears = timeInDays / 365;

  const frequencyMap: Record<CompoundFrequency, number> = {
    daily: 365,
    weekly: 52,
    biweekly: 26,
    monthly: 12,
    quarterly: 4,
    yearly: 1,
  };

  const n = frequencyMap[compoundFrequency] || 12;

  const totalAmount = principal * Math.pow(1 + rateDecimal / n, n * timeInYears);
  const interestAmount = totalAmount - principal;

  return {
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    interestAmount: parseFloat(interestAmount.toFixed(2)),
  };
}

/**
 * Calculate total amount due for a loan
 */
export function calculateTotalAmountDue({
  principalAmount,
  interestRate,
  issueDate,
  dueDate,
  interestType,
  compoundFrequency,
}: {
  principalAmount: number;
  interestRate: number;
  issueDate: Date;
  dueDate: Date;
  interestType: InterestType;
  compoundFrequency?: CompoundFrequency;
}): { totalAmountDue: number; interestAmount: number } {
  if (interestType === 'none' || !interestRate || interestRate === 0) {
    return {
      totalAmountDue: principalAmount,
      interestAmount: 0,
    };
  }

  const timeInDays = Math.ceil((dueDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));

  let interestAmount = 0;

  if (interestType === 'simple') {
    interestAmount = calculateSimpleInterest(principalAmount, interestRate, timeInDays);
  } else if (interestType === 'compound' && compoundFrequency) {
    const result = calculateCompoundInterest(principalAmount, interestRate, timeInDays, compoundFrequency);
    interestAmount = result.interestAmount;
  }

  return {
    totalAmountDue: parseFloat((principalAmount + interestAmount).toFixed(2)),
    interestAmount: parseFloat(interestAmount.toFixed(2)),
  };
}

/**
 * Calculate interest for a specific period
 */
export function calculatePeriodInterest(
  principal: number,
  ratePerAnnum: number,
  startDate: Date,
  endDate: Date,
  interestType: InterestType = 'simple',
  compoundFrequency?: CompoundFrequency
): number {
  const timeInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (timeInDays <= 0) return 0;

  if (interestType === 'simple') {
    return calculateSimpleInterest(principal, ratePerAnnum, timeInDays);
  } else if (interestType === 'compound' && compoundFrequency) {
    const { interestAmount } = calculateCompoundInterest(principal, ratePerAnnum, timeInDays, compoundFrequency);
    return interestAmount;
  }

  return 0;
}

/**
 * Calculate payment breakdown (principal vs interest)
 */
export function calculatePaymentBreakdown(
  paymentAmount: number,
  accruedInterest: number,
  outstandingPrincipal: number
): { principalPortion: number; interestPortion: number } {
  let interestPortion = Math.min(paymentAmount, accruedInterest);
  let principalPortion = Math.max(0, paymentAmount - interestPortion);

  if (principalPortion > outstandingPrincipal) {
    principalPortion = outstandingPrincipal;
  }

  return {
    principalPortion: parseFloat(principalPortion.toFixed(2)),
    interestPortion: parseFloat(interestPortion.toFixed(2)),
  };
}

/**
 * Calculate accrued interest up to current date
 */
export function calculateAccruedInterest({
  principalAmount,
  interestRate,
  lastCalculationDate,
  currentDate = new Date(),
  interestType,
  compoundFrequency,
}: {
  principalAmount: number;
  interestRate: number;
  lastCalculationDate: Date;
  currentDate?: Date;
  interestType: InterestType;
  compoundFrequency?: CompoundFrequency;
}): number {
  return calculatePeriodInterest(
    principalAmount,
    interestRate,
    lastCalculationDate,
    currentDate,
    interestType,
    compoundFrequency
  );
}
