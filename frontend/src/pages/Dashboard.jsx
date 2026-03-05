import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { summaryAPI, transactionsAPI } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#6C5CE7', '#00B894', '#FDCB6E', '#E17055', '#74B9FF', '#A29BFE', '#55EFC4', '#FD79A8'];

const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ScoreGauge = ({ score }) => {
    const getColor = () => {
        if (score >= 70) return '#00B894';
        if (score >= 40) return '#FDCB6E';
        return '#E17055';
    };

    const getLabel = () => {
        if (score >= 70) return 'Healthy 🌟';
        if (score >= 40) return 'Fair 📈';
        return 'Needs Attention ⚠️';
    };

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="score-gauge">
            <svg viewBox="0 0 120 120" className="gauge-svg">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#2d2d3a" strokeWidth="12" />
                <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={getColor()}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" fill={getColor()}>
                    {score}
                </text>
                <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#9b9bb4">
                    /100
                </text>
            </svg>
            <p className="gauge-label" style={{ color: getColor() }}>{getLabel()}</p>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [healthScore, setHealthScore] = useState(null);
    const [recentTxns, setRecentTxns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                setError('');
                const [summaryRes, scoreRes, txnRes] = await Promise.all([
                    summaryAPI.getSummary(),
                    summaryAPI.getHealthScore(),
                    transactionsAPI.getAll({ limit: 5, page: 1 }),
                ]);
                setSummary(summaryRes.data.summary);
                setHealthScore(scoreRes.data.healthScore);
                setRecentTxns(txnRes.data.data || []);
            } catch (err) {
                const msg = err.response?.data?.message || 'Failed to load dashboard data.';
                setError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading-screen">
                    <div className="spinner" />
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Something went wrong</h3>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const hasTransactions = recentTxns.length > 0 || (summary?.transactionCount || 0) > 0;
    const pieData = (summary?.categoryBreakdown || []).map((c) => ({
        name: c.category,
        value: parseFloat(c.amount) || 0,
    }));

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="page-subtitle">
                        {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })} Overview
                    </p>
                </div>
                <Link to="/transactions" className="btn btn-primary">
                    + Add Transaction
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="cards-grid">
                <div className="card card-income">
                    <div className="card-label">Total Income</div>
                    <div className="card-value">{formatCurrency(summary?.totalIncome)}</div>
                    <div className="card-icon">📥</div>
                </div>
                <div className="card card-expense">
                    <div className="card-label">Total Expenses</div>
                    <div className="card-value">{formatCurrency(summary?.totalExpenses)}</div>
                    <div className="card-icon">📤</div>
                </div>
                <div className="card card-savings">
                    <div className="card-label">Net Savings</div>
                    <div className={`card-value ${(parseFloat(summary?.netSavings) || 0) < 0 ? 'negative' : ''}`}>
                        {formatCurrency(summary?.netSavings)}
                    </div>
                    <div className="card-icon">💎</div>
                </div>
                <div className="card card-transactions">
                    <div className="card-label">Transactions</div>
                    <div className="card-value">{summary?.transactionCount || 0}</div>
                    <div className="card-icon">📋</div>
                </div>
            </div>

            {!hasTransactions ? (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No transactions yet</h3>
                    <p>Add your first income or expense to see your financial dashboard.</p>
                    <Link to="/transactions" className="btn btn-primary">
                        Add Your First Transaction
                    </Link>
                </div>
            ) : (
                <div className="dashboard-grid">
                    {/* Health Score */}
                    <div className="card-panel">
                        <h2 className="panel-title">Financial Health Score</h2>
                        {healthScore?.noData ? (
                            <p className="no-data-text">Add transactions this month to calculate your score.</p>
                        ) : (
                            <>
                                <ScoreGauge score={healthScore?.score || 0} />
                                <div className="score-components">
                                    {[
                                        { label: 'Savings Rate', key: 'savingsRate', weight: '40%' },
                                        { label: 'Expense Ratio', key: 'expenseRatio', weight: '30%' },
                                        { label: 'Consistency', key: 'spendingConsistency', weight: '20%' },
                                        { label: 'Diversity', key: 'categoryDiversity', weight: '10%' },
                                    ].map(({ label, key, weight }) => {
                                        const val = healthScore?.components?.[key] ?? 0;
                                        return (
                                            <div key={key} className="score-row">
                                                <span className="score-label">
                                                    {label} <span className="score-weight">({weight})</span>
                                                </span>
                                                <div className="score-bar-track">
                                                    <div
                                                        className="score-bar-fill"
                                                        style={{ width: `${val}%`, background: val >= 70 ? '#00B894' : val >= 40 ? '#FDCB6E' : '#E17055' }}
                                                    />
                                                </div>
                                                <span className="score-val">{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Spending Breakdown Pie Chart */}
                    <div className="card-panel">
                        <h2 className="panel-title">Spending by Category</h2>
                        {pieData.length === 0 ? (
                            <div className="no-data-text">No expense data to display.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => formatCurrency(val)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Recent Transactions */}
                    <div className="card-panel span-full">
                        <div className="panel-header">
                            <h2 className="panel-title">Recent Transactions</h2>
                            <Link to="/transactions" className="btn btn-ghost btn-sm">
                                View All
                            </Link>
                        </div>
                        {recentTxns.length === 0 ? (
                            <div className="no-data-text">No transactions found.</div>
                        ) : (
                            <div className="txn-list">
                                {recentTxns.map((txn) => (
                                    <div key={txn._id} className="txn-row">
                                        <div className="txn-icon">
                                            {txn.type === 'income' ? '📥' : '📤'}
                                        </div>
                                        <div className="txn-info">
                                            <span className="txn-category">{txn.category}</span>
                                            <span className="txn-desc">{txn.description || '—'}</span>
                                        </div>
                                        <div className="txn-date">
                                            {new Date(txn.date).toLocaleDateString('en-IN')}
                                        </div>
                                        <div className={`txn-amount ${txn.type}`}>
                                            {txn.type === 'income' ? '+' : '-'}
                                            {formatCurrency(txn.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
