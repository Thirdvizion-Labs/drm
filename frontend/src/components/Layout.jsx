import { Link, Outlet, useNavigate } from 'react-router-dom';
import { getUser, logout } from '../api/auth';
import { ToastContainer } from './Toast';
import { useState, useEffect } from 'react';

export default function Layout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { setUser(getUser()); }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">🧠 StriveHigh</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                {(user.role === 'admin' || user.role === 'instructor') && (
                  <Link to="/admin" className="nav-link">Admin</Link>
                )}
                <div className="nav-user">
                  <span>{user.name}</span>
                  <button onClick={handleLogout} className="btn btn-sm btn-outline">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="main-content"><Outlet /></main>
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 StriveHigh. Supporting mental health education with secure content delivery.</p>
        </div>
      </footer>
      <ToastContainer />
    </>
  );
}
