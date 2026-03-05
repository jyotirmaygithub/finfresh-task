import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {
        setServerError('');
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            setServerError(msg);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">💰</div>
                    <h1>FinFresh</h1>
                    <p>Your Personal Finance Dashboard</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                    <h2>Sign In</h2>

                    {serverError && <div className="alert alert-error">{serverError}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            className={errors.email ? 'input-error' : ''}
                            {...register('email', {
                                required: 'Email is required',
                                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                            })}
                        />
                        {errors.email && <span className="field-error">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            className={errors.password ? 'input-error' : ''}
                            {...register('password', { required: 'Password is required' })}
                        />
                        {errors.password && <span className="field-error">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
                        {isSubmitting ? <span className="spinner-sm" /> : 'Sign In'}
                    </button>

                    <p className="auth-switch">
                        Don&apos;t have an account?{' '}
                        <Link to="/register">Create one</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
