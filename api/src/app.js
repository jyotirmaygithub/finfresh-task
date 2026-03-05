const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const summaryRoutes = require('./routes/summary');

const app = express();

// CORS — allow frontend origin
app.use((req, res, next) => {
    const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Security headers
app.use(helmet());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/ping', (req, res) => res.json({ success: true, message: 'FinFresh API is running.' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', summaryRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: err.message || 'An unexpected error occurred.',
    });
});

module.exports = app;
