/**
 * Loan Service
 * Business logic for loan management
 */

const { Loan, Payment, User, Attachment } = require('../models');
const { calculateTotalAmountDue } = require('../utils/calculations/interestCalculator');
const { calculateEMI, generateAmortizationSchedule } = require('../utils/calculations/emiCalculator');
const { Op } = require('sequelize');

class LoanService {
  /**
   * Create a new loan
   */
  async createLoan(loanData, userId) {
    try {
      // Calculate total amount due and EMI
      const { totalAmountDue, interestAmount } = calculateTotalAmountDue({
        principalAmount: loanData.principalAmount,
        interestRate: loanData.interestRate || 0,
        issueDate: new Date(loanData.issueDate),
        dueDate: loanData.dueDate ? new Date(loanData.dueDate) : null,
        interestType: loanData.interestType || 'none',
        compoundFrequency: loanData.compoundFrequency
      });

      // Calculate EMI if installments are specified
      let emiAmount = null;
      if (loanData.numberOfInstallments && loanData.numberOfInstallments > 0) {
        emiAmount = calculateEMI(
          loanData.principalAmount,
          loanData.interestRate || 0,
          loanData.numberOfInstallments,
          loanData.paymentFrequency || 'monthly'
        );
      }

      // Create loan record
      const loan = await Loan.create({
        ...loanData,
        userId,
        totalAmountDue,
        emiAmount,
        outstandingBalance: totalAmountDue,
        createdBy: userId
      });

      // Generate amortization schedule if applicable
      let amortizationSchedule = null;
      if (loanData.numberOfInstallments && loanData.numberOfInstallments > 0) {
        const firstPaymentDate = new Date(loanData.issueDate);
        firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

        amortizationSchedule = generateAmortizationSchedule({
          principal: loanData.principalAmount,
          annualInterestRate: loanData.interestRate || 0,
          numberOfInstallments: loanData.numberOfInstallments,
          paymentFrequency: loanData.paymentFrequency || 'monthly',
          firstPaymentDate
        });
      }

      return {
        loan,
        amortizationSchedule
      };
    } catch (error) {
      throw new Error(`Failed to create loan: ${error.message}`);
    }
  }

  /**
   * Get all loans for a user with filters
   */
  async getLoans(userId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        sortBy = 'createdAt',
        order = 'DESC',
        search,
        minAmount,
        maxAmount,
        dateFrom,
        dateTo
      } = filters;

      // Build where clause
      const where = { userId };

      if (type) where.loanType = type;
      if (status) where.status = status;

      if (search) {
        where.counterpartyName = {
          [Op.iLike]: `%${search}%`
        };
      }

      if (minAmount || maxAmount) {
        where.principalAmount = {};
        if (minAmount) where.principalAmount[Op.gte] = minAmount;
        if (maxAmount) where.principalAmount[Op.lte] = maxAmount;
      }

      if (dateFrom || dateTo) {
        where.issueDate = {};
        if (dateFrom) where.issueDate[Op.gte] = dateFrom;
        if (dateTo) where.issueDate[Op.lte] = dateTo;
      }

      // Calculate pagination
      const offset = (page - 1) * limit;

      // Fetch loans
      const { count, rows } = await Loan.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [[sortBy, order.toUpperCase()]],
        include: [
          {
            model: Payment,
            as: 'payments',
            attributes: ['id', 'amount', 'paymentDate', 'status']
          }
        ]
      });

      return {
        loans: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch loans: ${error.message}`);
    }
  }

  /**
   * Get loan by ID with all related data
   */
  async getLoanById(loanId, userId) {
    try {
      const loan = await Loan.findOne({
        where: { id: loanId, userId },
        include: [
          {
            model: Payment,
            as: 'payments',
            order: [['paymentDate', 'ASC']]
          },
          {
            model: Attachment,
            as: 'attachments'
          }
        ]
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      return loan;
    } catch (error) {
      throw new Error(`Failed to fetch loan: ${error.message}`);
    }
  }

  /**
   * Update loan
   */
  async updateLoan(loanId, userId, updateData) {
    try {
      const loan = await Loan.findOne({
        where: { id: loanId, userId }
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      // Recalculate if interest or amount changed
      if (updateData.principalAmount || updateData.interestRate || updateData.dueDate) {
        const { totalAmountDue } = calculateTotalAmountDue({
          principalAmount: updateData.principalAmount || loan.principalAmount,
          interestRate: updateData.interestRate !== undefined ? updateData.interestRate : loan.interestRate,
          issueDate: new Date(loan.issueDate),
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : new Date(loan.dueDate),
          interestType: loan.interestType,
          compoundFrequency: loan.compoundFrequency
        });

        updateData.totalAmountDue = totalAmountDue;
        updateData.outstandingBalance = totalAmountDue - parseFloat(loan.totalPaid);
      }

      await loan.update({
        ...updateData,
        updatedBy: userId
      });

      return loan;
    } catch (error) {
      throw new Error(`Failed to update loan: ${error.message}`);
    }
  }

  /**
   * Delete loan
   */
  async deleteLoan(loanId, userId) {
    try {
      const loan = await Loan.findOne({
        where: { id: loanId, userId },
        include: [{ model: Payment, as: 'payments' }]
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      // Check if loan has payments
      if (loan.payments && loan.payments.length > 0) {
        throw new Error('Cannot delete loan with existing payments. Consider marking as written off instead.');
      }

      await loan.destroy();
      return { message: 'Loan deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete loan: ${error.message}`);
    }
  }

  /**
   * Get loan amortization schedule
   */
  async getLoanAmortization(loanId, userId) {
    try {
      const loan = await Loan.findOne({
        where: { id: loanId, userId }
      });

      if (!loan) {
        throw new Error('Loan not found');
      }

      if (!loan.numberOfInstallments) {
        throw new Error('Loan does not have installment schedule');
      }

      const firstPaymentDate = new Date(loan.issueDate);
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

      const schedule = generateAmortizationSchedule({
        principal: parseFloat(loan.principalAmount),
        annualInterestRate: parseFloat(loan.interestRate) || 0,
        numberOfInstallments: loan.numberOfInstallments,
        paymentFrequency: loan.paymentFrequency,
        firstPaymentDate
      });

      // Mark paid installments
      const payments = await Payment.findAll({
        where: { loanId, status: 'completed' },
        order: [['paymentDate', 'ASC']]
      });

      schedule.forEach((installment, index) => {
        installment.isPaid = index < payments.length;
        if (installment.isPaid) {
          installment.paidDate = payments[index].paymentDate;
          installment.paidAmount = parseFloat(payments[index].amount);
        }
      });

      return { schedule };
    } catch (error) {
      throw new Error(`Failed to generate amortization schedule: ${error.message}`);
    }
  }

  /**
   * Calculate loan preview (before creating)
   */
  async calculateLoanPreview(loanDetails) {
    try {
      const { totalAmountDue, interestAmount } = calculateTotalAmountDue({
        principalAmount: loanDetails.principalAmount,
        interestRate: loanDetails.interestRate || 0,
        issueDate: new Date(loanDetails.issueDate || new Date()),
        dueDate: loanDetails.dueDate ? new Date(loanDetails.dueDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        interestType: loanDetails.interestType || 'none',
        compoundFrequency: loanDetails.compoundFrequency
      });

      let emiAmount = null;
      let schedule = null;

      if (loanDetails.numberOfInstallments && loanDetails.numberOfInstallments > 0) {
        emiAmount = calculateEMI(
          loanDetails.principalAmount,
          loanDetails.interestRate || 0,
          loanDetails.numberOfInstallments,
          loanDetails.paymentFrequency || 'monthly'
        );

        const firstPaymentDate = loanDetails.firstPaymentDate
          ? new Date(loanDetails.firstPaymentDate)
          : new Date(new Date().setMonth(new Date().getMonth() + 1));

        schedule = generateAmortizationSchedule({
          principal: loanDetails.principalAmount,
          annualInterestRate: loanDetails.interestRate || 0,
          numberOfInstallments: loanDetails.numberOfInstallments,
          paymentFrequency: loanDetails.paymentFrequency || 'monthly',
          firstPaymentDate
        });
      }

      return {
        principalAmount: loanDetails.principalAmount,
        interestAmount,
        totalAmountDue,
        emiAmount,
        schedule
      };
    } catch (error) {
      throw new Error(`Failed to calculate loan preview: ${error.message}`);
    }
  }
}

module.exports = new LoanService();
