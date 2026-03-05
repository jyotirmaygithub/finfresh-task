import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/dashboard" className="brand-link">
                    <span className="brand-icon">💰</span>
                    <span className="brand-name">FinFresh</span>
                </Link>
            </div>

            <div className="navbar-links">
                <Link
                    to="/dashboard"
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                    Dashboard
                </Link>
                <Link
                    to="/transactions"
                    className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}
                >
                    Transactions
                </Link>
            </div>

            <div className="navbar-user">
                <span className="user-greeting">Hi, {user?.name?.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
