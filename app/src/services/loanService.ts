/**
 * Loan Service
 * Business logic for loan management using Drizzle ORM
 */

import { eq, and, desc, asc, or, like, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { loans, payments, type Loan, type NewLoan, type Payment } from '../db/schema';
import { calculateTotalAmountDue } from '../utils/interestCalculator';
import { calculateEMI, generateAmortizationSchedule, type PaymentFrequency } from '../utils/emiCalculator';

export interface CreateLoanInput extends Omit<NewLoan, 'id' | 'createdAt' | 'updatedAt' | 'totalAmountDue' | 'emiAmount' | 'outstandingBalance'> {
  // Required fields are already in NewLoan
}

export interface UpdateLoanInput extends Partial<Omit<NewLoan, 'id' | 'userId' | 'createdAt'>> {
  // Allow updating most fields except id, userId, createdAt
}

export interface LoanFilters {
  userId: string;
  loanType?: 'given' | 'taken';
  status?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'dueDate' | 'principalAmount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class LoanService {
  /**
   * Create a new loan
   */
  static async createLoan(input: CreateLoanInput): Promise<Loan> {
    // Calculate total amount due and EMI
    const { totalAmountDue, interestAmount } = calculateTotalAmountDue({
      principalAmount: input.principalAmount,
      interestRate: input.interestRate || 0,
      issueDate: new Date(input.issueDate),
      dueDate: input.dueDate ? new Date(input.dueDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      interestType: input.interestType || 'none',
      compoundFrequency: input.compoundFrequency,
    });

    // Calculate EMI if installments are specified
    let emiAmount: number | null = null;
    if (input.numberOfInstallments && input.numberOfInstallments > 0) {
      emiAmount = calculateEMI(
        input.principalAmount,
        input.interestRate || 0,
        input.numberOfInstallments,
        (input.paymentFrequency as PaymentFrequency) || 'monthly'
      );
    }

    // Create loan record
    const [loan] = await db
      .insert(loans)
      .values({
        ...input,
        totalAmountDue,
        emiAmount,
        outstandingBalance: totalAmountDue,
        totalPaid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return loan;
  }

  /**
   * Get loan by ID
   */
  static async getLoanById(loanId: string, userId: string): Promise<Loan | null> {
    const [loan] = await db.select().from(loans).where(and(eq(loans.id, loanId), eq(loans.userId, userId)));

    return loan || null;
  }

  /**
   * Get all loans with filters
   */
  static async getLoans(filters: LoanFilters): Promise<{ loans: Loan[]; total: number }> {
    const conditions = [eq(loans.userId, filters.userId)];

    if (filters.loanType) {
      conditions.push(eq(loans.loanType, filters.loanType));
    }

    if (filters.status) {
      conditions.push(eq(loans.status, filters.status as any));
    }

    if (filters.search) {
      conditions.push(like(loans.counterpartyName, `%${filters.search}%`));
    }

    if (filters.minAmount !== undefined) {
      conditions.push(gte(loans.principalAmount, filters.minAmount));
    }

    if (filters.maxAmount !== undefined) {
      conditions.push(lte(loans.principalAmount, filters.maxAmount));
    }

    if (filters.dateFrom) {
      conditions.push(gte(loans.issueDate, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(loans.issueDate, filters.dateTo));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(whereClause);

    // Get loans with pagination
    const sortColumn = filters.sortBy === 'dueDate' ? loans.dueDate : filters.sortBy === 'principalAmount' ? loans.principalAmount : loans.createdAt;

    const sortOrder = filters.sortOrder === 'asc' ? asc : desc;

    const loansList = await db
      .select()
      .from(loans)
      .where(whereClause)
      .orderBy(sortOrder(sortColumn))
      .limit(filters.limit || 10)
      .offset(filters.offset || 0);

    return {
      loans: loansList,
      total: Number(count),
    };
  }

  /**
   * Update loan
   */
  static async updateLoan(loanId: string, userId: string, input: UpdateLoanInput): Promise<Loan | null> {
    // Check if loan exists and belongs to user
    const existingLoan = await this.getLoanById(loanId, userId);
    if (!existingLoan) {
      return null;
    }

    // Recalculate if relevant fields changed
    let updateData: any = { ...input, updatedAt: new Date() };

    if (
      input.principalAmount !== undefined ||
      input.interestRate !== undefined ||
      input.dueDate !== undefined ||
      input.interestType !== undefined ||
      input.compoundFrequency !== undefined
    ) {
      const { totalAmountDue } = calculateTotalAmountDue({
        principalAmount: input.principalAmount || existingLoan.principalAmount,
        interestRate: input.interestRate !== undefined ? input.interestRate : existingLoan.interestRate || 0,
        issueDate: new Date(existingLoan.issueDate),
        dueDate: input.dueDate ? new Date(input.dueDate) : existingLoan.dueDate ? new Date(existingLoan.dueDate) : new Date(),
        interestType: input.interestType || existingLoan.interestType,
        compoundFrequency: input.compoundFrequency || existingLoan.compoundFrequency,
      });

      updateData.totalAmountDue = totalAmountDue;
      updateData.outstandingBalance = totalAmountDue - (existingLoan.totalPaid || 0);
    }

    // Update loan
    const [updatedLoan] = await db.update(loans).set(updateData).where(and(eq(loans.id, loanId), eq(loans.userId, userId))).returning();

    return updatedLoan || null;
  }

  /**
   * Delete loan
   */
  static async deleteLoan(loanId: string, userId: string): Promise<boolean> {
    // Check if loan has payments
    const loanPayments = await db.select().from(payments).where(eq(payments.loanId, loanId));

    if (loanPayments.length > 0) {
      throw new Error('Cannot delete loan with existing payments');
    }

    const result = await db.delete(loans).where(and(eq(loans.id, loanId), eq(loans.userId, userId)));

    return true;
  }

  /**
   * Get loan amortization schedule
   */
  static async getLoanAmortization(loanId: string, userId: string) {
    const loan = await this.getLoanById(loanId, userId);

    if (!loan) {
      throw new Error('Loan not found');
    }

    if (!loan.numberOfInstallments) {
      throw new Error('Loan does not have installment schedule');
    }

    const firstPaymentDate = new Date(loan.issueDate);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

    const schedule = generateAmortizationSchedule({
      principal: loan.principalAmount,
      annualInterestRate: loan.interestRate || 0,
      numberOfInstallments: loan.numberOfInstallments,
      paymentFrequency: (loan.paymentFrequency as PaymentFrequency) || 'monthly',
      firstPaymentDate,
    });

    // Mark paid installments
    const loanPayments = await db.select().from(payments).where(eq(payments.loanId, loanId)).orderBy(asc(payments.paymentDate));

    schedule.forEach((installment, index) => {
      if (index < loanPayments.length && loanPayments[index].status === 'completed') {
        installment.isPaid = true;
        installment.paidDate = new Date(loanPayments[index].paymentDate);
        installment.paidAmount = loanPayments[index].amount;
      }
    });

    return { schedule };
  }

  /**
   * Get dashboard summary for a user
   */
  static async getDashboardSummary(userId: string) {
    const userLoans = await db.select().from(loans).where(eq(loans.userId, userId));

    const loansGiven = userLoans.filter((l) => l.loanType === 'given');
    const loansTaken = userLoans.filter((l) => l.loanType === 'taken');

    const totalLent = loansGiven.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
    const receivables = loansGiven.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

    const totalBorrowed = loansTaken.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
    const payables = loansTaken.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

    const overdueLoan = userLoans.filter((l) => l.status === 'overdue');
    const overdueAmount = overdueLoan.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

    return {
      loansGiven: {
        count: loansGiven.length,
        totalAmount: totalLent,
        receivables,
      },
      loansTaken: {
        count: loansTaken.length,
        totalAmount: totalBorrowed,
        payables,
      },
      netPosition: receivables - payables,
      overdue: {
        count: overdueLoan.length,
        amount: overdueAmount,
      },
      totalLoans: userLoans.length,
      activeCount: userLoans.filter((l) => l.status === 'active' || l.status === 'partially_paid').length,
      fullyPaidCount: userLoans.filter((l) => l.status === 'fully_paid').length,
    };
  }
}
