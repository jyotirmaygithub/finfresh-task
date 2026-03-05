const express = require('express');
const { body } = require('express-validator');
const {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
} = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All transaction routes are protected
router.use(authMiddleware);

const transactionValidation = [
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number greater than 0'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('description').optional().isLength({ max: 200 }).withMessage('Description max 200 chars'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];

const updateValidation = [
    body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('description').optional().isLength({ max: 200 }).withMessage('Description max 200 chars'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
];

router.post('/', transactionValidation, createTransaction);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.put('/:id', updateValidation, updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
