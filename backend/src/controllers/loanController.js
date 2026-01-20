/**
 * Loan Controller
 * Handles HTTP requests for loan management
 */

const loanService = require('../services/loanService');

class LoanController {
  /**
   * Create a new loan
   * POST /api/v1/loans
   */
  async createLoan(req, res, next) {
    try {
      const userId = req.user.id;
      const loanData = req.body;

      const result = await loanService.createLoan(loanData, userId);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Loan created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all loans with filters
   * GET /api/v1/loans
   */
  async getLoans(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await loanService.getLoans(userId, filters);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get loan by ID
   * GET /api/v1/loans/:loanId
   */
  async getLoanById(req, res, next) {
    try {
      const userId = req.user.id;
      const { loanId } = req.params;

      const loan = await loanService.getLoanById(loanId, userId);

      res.status(200).json({
        success: true,
        data: { loan },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update loan
   * PUT /api/v1/loans/:loanId
   */
  async updateLoan(req, res, next) {
    try {
      const userId = req.user.id;
      const { loanId } = req.params;
      const updateData = req.body;

      const loan = await loanService.updateLoan(loanId, userId, updateData);

      res.status(200).json({
        success: true,
        data: { loan },
        message: 'Loan updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete loan
   * DELETE /api/v1/loans/:loanId
   */
  async deleteLoan(req, res, next) {
    try {
      const userId = req.user.id;
      const { loanId } = req.params;

      const result = await loanService.deleteLoan(loanId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get loan amortization schedule
   * GET /api/v1/loans/:loanId/amortization
   */
  async getAmortization(req, res, next) {
    try {
      const userId = req.user.id;
      const { loanId } = req.params;

      const result = await loanService.getLoanAmortization(loanId, userId);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate loan preview
   * POST /api/v1/loans/calculate
   */
  async calculateLoan(req, res, next) {
    try {
      const loanDetails = req.body;

      const result = await loanService.calculateLoanPreview(loanDetails);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LoanController();
