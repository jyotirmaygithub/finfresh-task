import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ff_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 globally — clear token and redirect
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('ff_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: (token) =>
        axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        }),
};

// Transactions API
export const transactionsAPI = {
    getAll: (params) => api.get('/transactions', { params }),
    create: (data) => api.post('/transactions', data),
    update: (id, data) => api.put(`/transactions/${id}`, data),
    remove: (id) => api.delete(`/transactions/${id}`),
};

// Summary & Health Score API
export const summaryAPI = {
    getSummary: (params) => api.get('/summary', { params }),
    getHealthScore: () => api.get('/health-score'),
};

export default api;
