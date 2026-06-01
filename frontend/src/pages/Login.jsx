import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { toast } from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast('Login successful!', 'success');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue your mental wellness journey</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block">Sign In</button>
          </div>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
        <div className="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <p>Admin: admin@mindwell.com / admin123</p>
          <p>Learner: test@test.com / test123</p>
        </div>
      </div>
    </div>
  );
}
