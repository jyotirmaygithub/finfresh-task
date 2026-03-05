import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { transactionsAPI } from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = {
    income: ['salary', 'freelance', 'investment', 'gift', 'other_income'],
    expense: ['food', 'transport', 'housing', 'utilities', 'healthcare', 'entertainment', 'shopping', 'education', 'insurance', 'other_expense'],
};

const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (d) => {
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return '—';
    }
};

const TransactionModal = ({ onClose, onSaved, editData }) => {
    const isEdit = !!editData;
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: editData
            ? {
                type: editData.type,
                amount: editData.amount,
                category: editData.category,
                description: editData.description || '',
                date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
            }
            : { type: 'expense', date: new Date().toISOString().split('T')[0] },
    });

    const selectedType = watch('type');

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                amount: parseFloat(data.amount),
            };
            if (isEdit) {
                await transactionsAPI.update(editData._id, payload);
                toast.success('Transaction updated!');
            } else {
                await transactionsAPI.create(payload);
                toast.success('Transaction added!');
            }
            onSaved();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save transaction.';
            toast.error(msg);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Type</label>
                            <select {...register('type', { required: 'Type is required' })} className={errors.type ? 'input-error' : ''}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                            {errors.type && <span className="field-error">{errors.type.message}</span>}
                        </div>

                        <div className="form-group">
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                className={errors.amount ? 'input-error' : ''}
                                {...register('amount', {
                                    required: 'Amount is required',
                                    min: { value: 0.01, message: 'Amount must be > 0' },
                                    validate: (v) => !isNaN(parseFloat(v)) || 'Must be a valid number',
                                })}
                            />
                            {errors.amount && <span className="field-error">{errors.amount.message}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Category</label>
                            <select {...register('category', { required: 'Category is required' })} className={errors.category ? 'input-error' : ''}>
                                <option value="">Select category...</option>
                                {(CATEGORIES[selectedType] || CATEGORIES.expense).map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <span className="field-error">{errors.category.message}</span>}
                        </div>

                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                className={errors.date ? 'input-error' : ''}
                                {...register('date', { required: 'Date is required' })}
                            />
                            {errors.date && <span className="field-error">{errors.date.message}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description (optional)</label>
                        <input
                            type="text"
                            placeholder="Brief note..."
                            {...register('description', { maxLength: { value: 200, message: 'Max 200 characters' } })}
                        />
                        {errors.description && <span className="field-error">{errors.description.message}</span>}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <span className="spinner-sm" /> : isEdit ? 'Update' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [filter, setFilter] = useState({ type: '', page: 1, limit: 20 });
    const [pagination, setPagination] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params = {};
            if (filter.type) params.type = filter.type;
            params.page = filter.page;
            params.limit = filter.limit;
            const res = await transactionsAPI.getAll(params);
            setTransactions(res.data.data || []);
            setPagination(res.data.pagination || {});
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load transactions.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleDelete = async (id) => {
        try {
            await transactionsAPI.remove(id);
            toast.success('Transaction deleted');
            setDeleteConfirm(null);
            fetchTransactions();
        } catch {
            toast.error('Failed to delete transaction.');
        }
    };

    const handleEdit = (txn) => {
        setEditData(txn);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditData(null);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditData(null);
    };

    const handleFilterChange = (e) => {
        setFilter((prev) => ({ ...prev, type: e.target.value, page: 1 }));
    };

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1>Transactions</h1>
                    <p className="page-subtitle">Manage your income and expenses</p>
                </div>
                <button className="btn btn-primary" onClick={handleAdd}>
                    + Add Transaction
                </button>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <select value={filter.type} onChange={handleFilterChange} className="filter-select">
                    <option value="">All Types</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expenses Only</option>
                </select>
                <span className="filter-count">
                    {pagination.total ?? 0} transaction{pagination.total !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Content */}
            {loading ? (
                <div className="loading-screen">
                    <div className="spinner" />
                    <p>Loading transactions...</p>
                </div>
            ) : error ? (
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Something went wrong</h3>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchTransactions}>Retry</button>
                </div>
            ) : transactions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No transactions found</h3>
                    <p>{filter.type ? `No ${filter.type} transactions yet.` : 'Start tracking by adding your first transaction.'}</p>
                    <button className="btn btn-primary" onClick={handleAdd}>Add Transaction</button>
                </div>
            ) : (
                <>
                    <div className="txn-table-wrapper">
                        <table className="txn-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn) => (
                                    <tr key={txn._id}>
                                        <td>
                                            <span className={`badge badge-${txn.type}`}>
                                                {txn.type === 'income' ? '📥' : '📤'} {txn.type}
                                            </span>
                                        </td>
                                        <td className="category-cell">
                                            {(txn.category || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </td>
                                        <td className="desc-cell">{txn.description || <span className="muted">—</span>}</td>
                                        <td>{formatDate(txn.date)}</td>
                                        <td className={`amount-cell ${txn.type}`}>
                                            {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(txn)}>Edit</button>
                                                <button className="btn btn-danger btn-xs" onClick={() => setDeleteConfirm(txn._id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={filter.page <= 1}
                                onClick={() => setFilter((p) => ({ ...p, page: p.page - 1 }))}
                            >
                                ← Prev
                            </button>
                            <span className="page-info">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={filter.page >= pagination.totalPages}
                                onClick={() => setFilter((p) => ({ ...p, page: p.page + 1 }))}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm Delete</h3>
                        </div>
                        <p style={{ padding: '0 1.5rem 1rem' }}>Are you sure you want to delete this transaction? This cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <TransactionModal onClose={handleModalClose} onSaved={fetchTransactions} editData={editData} />
            )}
        </div>
    );
};

export default Transactions;
