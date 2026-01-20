/**
 * Loan Routes
 */

const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Calculate loan (preview) - No auth needed for calculation
router.post('/calculate', loanController.calculateLoan);

// Loan CRUD operations
router.post('/', loanController.createLoan);
router.get('/', loanController.getLoans);
router.get('/:loanId', loanController.getLoanById);
router.put('/:loanId', loanController.updateLoan);
router.delete('/:loanId', loanController.deleteLoan);

// Amortization schedule
router.get('/:loanId/amortization', loanController.getAmortization);

module.exports = router;
