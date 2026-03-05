const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');

// POST /api/transactions
const createTransaction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { type, amount, category, description, date } = req.body;

        const transaction = await Transaction.create({
            userId: req.userId,
            type,
            amount: parseFloat(amount),
            category,
            description: description || '',
            date: date ? new Date(date) : new Date(),
        });

        return res.status(201).json({
            success: true,
            message: 'Transaction created.',
            transaction,
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/transactions
const getTransactions = async (req, res) => {
    try {
        const {
            type,
            category,
            startDate,
            endDate,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = { userId: req.userId };

        if (type && ['income', 'expense'].includes(type)) {
            filter.type = type;
        }

        if (category) {
            filter.category = category;
        }

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [transactions, total] = await Promise.all([
            Transaction.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum),
            Transaction.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found.' });
        }

        return res.status(200).json({ success: true, transaction });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid transaction ID.' });
        }
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PATCH /api/transactions/:id
const updateTransaction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const allowedFields = ['type', 'amount', 'category', 'description', 'date'];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = field === 'amount' ? parseFloat(req.body[field]) : req.body[field];
            }
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updates,
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found.' });
        }

        return res.status(200).json({ success: true, message: 'Transaction updated.', transaction });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid transaction ID.' });
        }
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found.' });
        }

        return res.status(200).json({ success: true, message: 'Transaction deleted.' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid transaction ID.' });
        }
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
};
