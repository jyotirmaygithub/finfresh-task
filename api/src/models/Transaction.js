const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['income', 'expense'];

const CATEGORIES = [
    // Income categories
    'salary',
    'freelance',
    'investment',
    'gift',
    'other_income',
    // Expense categories
    'food',
    'transport',
    'housing',
    'utilities',
    'healthcare',
    'entertainment',
    'shopping',
    'education',
    'insurance',
    'other_expense',
];

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: TRANSACTION_TYPES,
            required: [true, 'Transaction type is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than 0'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters'],
            default: '',
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound index for efficient querying by user and date range
transactionSchema.index({ userId: 1, date: -1 });
// Index for filtering by type within a user's transactions
transactionSchema.index({ userId: 1, type: 1 });
// Index for category-based aggregation
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;
