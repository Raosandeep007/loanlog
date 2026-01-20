/**
 * EMI Calculator Utilities
 * Handles EMI calculations for various payment frequencies
 */

export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'one_time' | 'custom';

export interface AmortizationEntry {
  installmentNumber: number;
  dueDate: Date;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
  isPaid?: boolean;
  paidDate?: Date;
  paidAmount?: number;
}

/**
 * Calculate EMI for reducing balance loans
 * Formula: EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1]
 */
export function calculateEMI(
  principal: number,
  annualInterestRate: number,
  numberOfInstallments: number,
  paymentFrequency: PaymentFrequency = 'monthly'
): number {
  if (principal <= 0) {
    throw new Error('Principal must be positive');
  }

  if (numberOfInstallments <= 0) {
    throw new Error('Number of installments must be positive');
  }

  if (!annualInterestRate || annualInterestRate === 0) {
    return parseFloat((principal / numberOfInstallments).toFixed(2));
  }

  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const ratePerPeriod = annualInterestRate / 100 / periodsPerYear;

  const emi =
    (principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfInstallments)) /
    (Math.pow(1 + ratePerPeriod, numberOfInstallments) - 1);

  return parseFloat(emi.toFixed(2));
}

/**
 * Generate complete EMI amortization schedule
 */
export function generateAmortizationSchedule({
  principal,
  annualInterestRate,
  numberOfInstallments,
  paymentFrequency,
  firstPaymentDate,
}: {
  principal: number;
  annualInterestRate: number;
  numberOfInstallments: number;
  paymentFrequency: PaymentFrequency;
  firstPaymentDate: Date;
}): AmortizationEntry[] {
  const emi = calculateEMI(principal, annualInterestRate, numberOfInstallments, paymentFrequency);
  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const ratePerPeriod = annualInterestRate ? annualInterestRate / 100 / periodsPerYear : 0;

  const schedule: AmortizationEntry[] = [];
  let remainingBalance = principal;
  let currentDate = new Date(firstPaymentDate);

  for (let installmentNumber = 1; installmentNumber <= numberOfInstallments; installmentNumber++) {
    const interestForPeriod = remainingBalance * ratePerPeriod;
    const principalForPeriod = emi - interestForPeriod;

    remainingBalance -= principalForPeriod;

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
      remainingBalance: parseFloat(Math.max(0, adjustedBalance).toFixed(2)),
    });

    currentDate = getNextPaymentDate(currentDate, paymentFrequency);
  }

  return schedule;
}

/**
 * Calculate number of installments required for a given EMI
 */
export function calculateNumberOfInstallments(
  principal: number,
  emiAmount: number,
  annualInterestRate: number,
  paymentFrequency: PaymentFrequency = 'monthly'
): number {
  if (emiAmount <= 0 || principal <= 0) {
    throw new Error('EMI and principal must be positive');
  }

  if (!annualInterestRate || annualInterestRate === 0) {
    return Math.ceil(principal / emiAmount);
  }

  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const ratePerPeriod = annualInterestRate / 100 / periodsPerYear;

  const minEMI = principal * ratePerPeriod;
  if (emiAmount <= minEMI) {
    throw new Error('EMI amount is too low to cover interest. Loan will never be repaid.');
  }

  const n = Math.log(emiAmount / (emiAmount - principal * ratePerPeriod)) / Math.log(1 + ratePerPeriod);

  return Math.ceil(n);
}

/**
 * Calculate prepayment effect on loan
 */
export function calculatePrepaymentEffect(
  {
    principal,
    annualInterestRate,
    numberOfInstallments,
    paymentFrequency,
    currentBalance,
    completedInstallments,
  }: {
    principal: number;
    annualInterestRate: number;
    numberOfInstallments: number;
    paymentFrequency: PaymentFrequency;
    currentBalance: number;
    completedInstallments: number;
  },
  prepaymentAmount: number,
  prepaymentOption: 'reduce_tenure' | 'reduce_emi' = 'reduce_tenure'
): {
  newPrincipal: number;
  newEMI?: number;
  newTenure?: number;
  tenureReduced?: number;
  emiReduced?: number;
  interestSaved: number;
  originalEMI?: number;
  originalTenure?: number;
} {
  const newPrincipal = currentBalance - prepaymentAmount;

  if (newPrincipal <= 0) {
    return {
      newPrincipal: 0,
      newEMI: 0,
      newTenure: 0,
      interestSaved: currentBalance - prepaymentAmount,
    };
  }

  const remainingInstallments = numberOfInstallments - completedInstallments;
  const originalEMI = calculateEMI(principal, annualInterestRate, numberOfInstallments, paymentFrequency);

  if (prepaymentOption === 'reduce_tenure') {
    const newTenure = calculateNumberOfInstallments(newPrincipal, originalEMI, annualInterestRate, paymentFrequency);
    const oldTotalPayment = originalEMI * remainingInstallments;
    const newTotalPayment = originalEMI * newTenure + prepaymentAmount;

    return {
      newPrincipal: parseFloat(newPrincipal.toFixed(2)),
      newEMI: originalEMI,
      originalTenure: remainingInstallments,
      newTenure,
      tenureReduced: remainingInstallments - newTenure,
      interestSaved: parseFloat((oldTotalPayment - newTotalPayment).toFixed(2)),
    };
  } else {
    const newEMI = calculateEMI(newPrincipal, annualInterestRate, remainingInstallments, paymentFrequency);
    const oldTotalPayment = originalEMI * remainingInstallments;
    const newTotalPayment = newEMI * remainingInstallments + prepaymentAmount;

    return {
      newPrincipal: parseFloat(newPrincipal.toFixed(2)),
      originalEMI,
      newEMI: parseFloat(newEMI.toFixed(2)),
      emiReduced: parseFloat((originalEMI - newEMI).toFixed(2)),
      newTenure: remainingInstallments,
      interestSaved: parseFloat((oldTotalPayment - newTotalPayment).toFixed(2)),
    };
  }
}

/**
 * Get number of periods per year for a given frequency
 */
export function getPeriodsPerYear(frequency: PaymentFrequency): number {
  const frequencyMap: Record<PaymentFrequency, number> = {
    daily: 365,
    weekly: 52,
    biweekly: 26,
    monthly: 12,
    quarterly: 4,
    yearly: 1,
    one_time: 1,
    custom: 12, // Default to monthly for custom
  };

  return frequencyMap[frequency] || 12;
}

/**
 * Calculate next payment date based on frequency
 */
export function getNextPaymentDate(currentDate: Date, frequency: PaymentFrequency, customDays?: number): Date {
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
 * Calculate principal from EMI and tenure
 */
export function calculatePrincipalFromEMI(
  emiAmount: number,
  numberOfInstallments: number,
  annualInterestRate: number,
  paymentFrequency: PaymentFrequency = 'monthly'
): { principal: number; totalAmount: number; totalInterest: number } {
  if (!annualInterestRate || annualInterestRate === 0) {
    return {
      principal: emiAmount * numberOfInstallments,
      totalAmount: emiAmount * numberOfInstallments,
      totalInterest: 0,
    };
  }

  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const ratePerPeriod = annualInterestRate / 100 / periodsPerYear;

  const principal =
    (emiAmount * (Math.pow(1 + ratePerPeriod, numberOfInstallments) - 1)) /
    (ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfInstallments));

  const totalAmount = emiAmount * numberOfInstallments;
  const totalInterest = totalAmount - principal;

  return {
    principal: parseFloat(principal.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
  };
}
