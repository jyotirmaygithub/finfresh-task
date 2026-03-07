const Transaction = require('../models/Transaction');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Financial Health Score Algorithm
 * Score range: 0–100, calculated for the current calendar month.
 *
 * Components:
 *   - Savings Rate (40%):  (income - expenses) / income, capped [0,1]
 *   - Expense Ratio (30%): 1 - min(expenses / income, 1)
 *   - Spending Consistency (20%): 1 - (stddev / mean) of daily expenses, capped [0,1]
 *   - Category Diversity (10%): min(uniqueCategories / 5, 1)
 */

const computeStdDev = (values) => {
    if (values.length <= 1) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
};

const clamp = (val, min = 0, max = 1) => Math.min(max, Math.max(min, val));

const calculateHealthScore = (transactions) => {
    if (!transactions || transactions.length === 0) {
        return {
            score: 0,
            noData: true,
            components: { savingsRate: 0, expenseRatio: 0, spendingConsistency: 0, categoryDiversity: 0 },
        };
    }

    const incomeTransactions = transactions.filter((t) => t.type === 'income');
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // 1. Savings Rate (40%) — how much of income is saved
    let savingsRate = 0;
    if (totalIncome > 0) {
        savingsRate = clamp((totalIncome - totalExpenses) / totalIncome);
    } else if (totalExpenses === 0) {
        savingsRate = 0; // no data effectively
    }
    // If income=0 but expenses>0, savingsRate stays 0 (spending with no income is bad)

    // 2. Expense Ratio (30%) — lower expenses relative to income is better
    let expenseRatio = 1; // default: perfect if no income and no expenses
    if (totalIncome > 0) {
        expenseRatio = clamp(1 - totalExpenses / totalIncome);
    } else if (totalExpenses > 0) {
        expenseRatio = 0; // spending with no income = worst score
    }

    // 3. Spending Consistency (20%) — consistent daily spending = better habits
    let spendingConsistency = 1;
    if (expenseTransactions.length > 1) {
        // Group expenses by day
        const dailyMap = {};
        for (const t of expenseTransactions) {
            const day = new Date(t.date).toDateString();
            dailyMap[day] = (dailyMap[day] || 0) + t.amount;
        }
        const dailyValues = Object.values(dailyMap);
        if (dailyValues.length > 1) {
            const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
            const stddev = computeStdDev(dailyValues);
            // Coefficient of variation: lower = more consistent
            const cv = mean > 0 ? stddev / mean : 0;
            spendingConsistency = clamp(1 - cv);
        }
    }

    // 4. Category Diversity (10%) — using multiple categories shows intentional budgeting
    const expenseCategories = new Set(expenseTransactions.map((t) => t.category));
    const categoryDiversity = clamp(expenseCategories.size / 5);

    // Final weighted score
    const rawScore =
        savingsRate * 0.4 +
        expenseRatio * 0.3 +
        spendingConsistency * 0.2 +
        categoryDiversity * 0.1;

    const score = Math.round(rawScore * 100);

    return {
        score,
        noData: false,
        components: {
            savingsRate: Math.round(savingsRate * 100),
            expenseRatio: Math.round(expenseRatio * 100),
            spendingConsistency: Math.round(spendingConsistency * 100),
            categoryDiversity: Math.round(categoryDiversity * 100),
        },
    };
};

// GET /api/summary
const getSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Default to current month if no date range provided
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const transactions = await Transaction.find({
            userId: req.userId,
            date: { $gte: start, $lte: end },
        }).lean();

        const totalIncome = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalExpenses = transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const netSavings = totalIncome - totalExpenses;

        // Category breakdown for expenses
        const categoryMap = {};
        for (const t of transactions.filter((t) => t.type === 'expense')) {
            categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
        }

        const categoryBreakdown = Object.entries(categoryMap)
            .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
            .sort((a, b) => b.amount - a.amount);

        // Income category breakdown
        const incomeCategoryMap = {};
        for (const t of transactions.filter((t) => t.type === 'income')) {
            incomeCategoryMap[t.category] = (incomeCategoryMap[t.category] || 0) + t.amount;
        }
        const incomeBreakdown = Object.entries(incomeCategoryMap)
            .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
            .sort((a, b) => b.amount - a.amount);

        return res.status(200).json({
            success: true,
            summary: {
                period: { start, end },
                totalIncome: Math.round(totalIncome * 100) / 100,
                totalExpenses: Math.round(totalExpenses * 100) / 100,
                netSavings: Math.round(netSavings * 100) / 100,
                transactionCount: transactions.length,
                categoryBreakdown,
                incomeBreakdown,
            },
        });
    } catch (error) {
        console.error('Get summary error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/health-score
const getHealthScore = async (req, res) => {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const transactions = await Transaction.find({
            userId: req.userId,
            date: { $gte: start, $lte: end },
        }).lean();

        let result;
        try {
            result = await new Promise((resolve, reject) => {
                const pythonProcess = spawn('python', [path.join(__dirname, '../scripts/health_score.py')]);
                let dataString = '';
                let errorString = '';

                pythonProcess.stdin.write(JSON.stringify(transactions));
                pythonProcess.stdin.end();

                pythonProcess.stdout.on('data', (data) => {
                    dataString += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    errorString += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.warn(`Python process exited with code ${code}: ${errorString}`);
                        reject(new Error('Python script failed'));
                    } else {
                        try {
                            resolve(JSON.parse(dataString));
                        } catch (e) {
                            reject(e);
                        }
                    }
                });
            });
            console.log('Health score calculated via Python');
        } catch (err) {
            console.warn('Falling back to JavaScript for health score calculation:', err.message);
            result = calculateHealthScore(transactions);
        }
        // --- Python Integration End ---

        // Score label
        let label = 'Needs Attention';
        if (result.score >= 70) label = 'Healthy';
        else if (result.score >= 40) label = 'Fair';

        return res.status(200).json({
            success: true,
            healthScore: {
                ...result,
                label,
                period: { start, end },
            },
        });
    } catch (error) {
        console.error('Health score error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getSummary, getHealthScore };
