import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm();

    const password = watch('password');

    const onSubmit = async (data) => {
        setServerError('');
        try {
            await registerUser(data.name, data.email, data.password);
            toast.success('Account created! Welcome to FinFresh 🎉');
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            setServerError(msg);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">💰</div>
                    <h1>FinFresh</h1>
                    <p>Start your financial wellness journey</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                    <h2>Create Account</h2>

                    {serverError && <div className="alert alert-error">{serverError}</div>}

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Your full name"
                            className={errors.name ? 'input-error' : ''}
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                            })}
                        />
                        {errors.name && <span className="field-error">{errors.name.message}</span>}
                    </div>

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
                            placeholder="At least 6 characters"
                            className={errors.password ? 'input-error' : ''}
                            {...register('password', {
                                required: 'Password is required',
                                minLength: { value: 6, message: 'Password must be at least 6 characters' },
                            })}
                        />
                        {errors.password && <span className="field-error">{errors.password.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Repeat your password"
                            className={errors.confirmPassword ? 'input-error' : ''}
                            {...register('confirmPassword', {
                                required: 'Please confirm your password',
                                validate: (val) => val === password || 'Passwords do not match',
                            })}
                        />
                        {errors.confirmPassword && (
                            <span className="field-error">{errors.confirmPassword.message}</span>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
                        {isSubmitting ? <span className="spinner-sm" /> : 'Create Account'}
                    </button>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
