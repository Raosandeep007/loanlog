/**
 * Payment Service
 * Business logic for payment management
 */

import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { payments, loans, type Payment, type NewPayment } from '../db/schema';
import { calculatePaymentBreakdown, calculateAccruedInterest } from '../utils/interestCalculator';

export interface CreatePaymentInput extends Omit<NewPayment, 'id' | 'createdAt' | 'updatedAt' | 'principalPortion' | 'interestPortion' | 'balanceAfterPayment'> {
  // Required fields are already in NewPayment
}

export class PaymentService {
  /**
   * Record a new payment
   */
  static async recordPayment(input: CreatePaymentInput): Promise<{ payment: Payment; updatedLoan: any }> {
    // Get loan details
    const [loan] = await db.select().from(loans).where(eq(loans.id, input.loanId));

    if (!loan) {
      throw new Error('Loan not found');
    }

    // Calculate accrued interest (if applicable)
    let accruedInterest = 0;
    if (loan.interestType !== 'none' && loan.interestRate) {
      accruedInterest = calculateAccruedInterest({
        principalAmount: loan.outstandingBalance || 0,
        interestRate: loan.interestRate,
        lastCalculationDate: new Date(loan.updatedAt),
        currentDate: new Date(input.paymentDate),
        interestType: loan.interestType,
        compoundFrequency: loan.compoundFrequency,
      });
    }

    // Calculate payment breakdown
    const { principalPortion, interestPortion } = calculatePaymentBreakdown(
      input.amount,
      accruedInterest,
      loan.outstandingBalance || 0
    );

    const balanceAfterPayment = Math.max(0, (loan.outstandingBalance || 0) - principalPortion);

    // Create payment record
    const [payment] = await db
      .insert(payments)
      .values({
        ...input,
        principalPortion,
        interestPortion,
        balanceAfterPayment,
        status: input.status || 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update loan
    const newTotalPaid = (loan.totalPaid || 0) + input.amount;
    const newOutstandingBalance = (loan.totalAmountDue || 0) - newTotalPaid;

    let newStatus: any = loan.status;
    if (newOutstandingBalance <= 0) {
      newStatus = 'fully_paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'partially_paid';
    }

    const [updatedLoan] = await db
      .update(loans)
      .set({
        totalPaid: newTotalPaid,
        outstandingBalance: Math.max(0, newOutstandingBalance),
        status: newStatus,
        closedAt: newStatus === 'fully_paid' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, input.loanId))
      .returning();

    return {
      payment,
      updatedLoan,
    };
  }

  /**
   * Get payment history for a loan
   */
  static async getPaymentHistory(loanId: string): Promise<Payment[]> {
    const paymentsList = await db.select().from(payments).where(eq(payments.loanId, loanId)).orderBy(desc(payments.paymentDate));

    return paymentsList;
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId: string): Promise<Payment | null> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));

    return payment || null;
  }

  /**
   * Update payment
   */
  static async updatePayment(paymentId: string, input: Partial<CreatePaymentInput>): Promise<Payment | null> {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    return updatedPayment || null;
  }

  /**
   * Delete payment
   */
  static async deletePayment(paymentId: string): Promise<boolean> {
    const payment = await this.getPaymentById(paymentId);

    if (!payment) {
      return false;
    }

    // Get loan and recalculate
    const [loan] = await db.select().from(loans).where(eq(loans.id, payment.loanId));

    if (loan) {
      const newTotalPaid = (loan.totalPaid || 0) - payment.amount;
      const newOutstandingBalance = (loan.totalAmountDue || 0) - newTotalPaid;

      let newStatus: any = 'active';
      if (newOutstandingBalance <= 0) {
        newStatus = 'fully_paid';
      } else if (newTotalPaid > 0) {
        newStatus = 'partially_paid';
      }

      await db
        .update(loans)
        .set({
          totalPaid: Math.max(0, newTotalPaid),
          outstandingBalance: Math.max(0, newOutstandingBalance),
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, payment.loanId));
    }

    // Delete payment
    await db.delete(payments).where(eq(payments.id, paymentId));

    return true;
  }
}
