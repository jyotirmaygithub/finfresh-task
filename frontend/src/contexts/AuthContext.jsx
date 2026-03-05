import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('ff_token'));
    const [loading, setLoading] = useState(true);

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await authAPI.getMe(token);
                setUser(res.data.user);
            } catch {
                localStorage.removeItem('ff_token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        verifyToken();
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await authAPI.login({ email, password });
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('ff_token', newToken);
        setToken(newToken);
        setUser(newUser);
        return newUser;
    }, []);

    const register = useCallback(async (name, email, password) => {
        const res = await authAPI.register({ name, email, password });
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('ff_token', newToken);
        setToken(newToken);
        setUser(newUser);
        return newUser;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('ff_token');
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
