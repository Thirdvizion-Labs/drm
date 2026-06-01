import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, login } from '../api/auth';
import { toast } from '../components/Toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      await login(email, password);
      toast('Account created!', 'success');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Your Account</h1>
          <p>Start your journey to better mental health</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block">Create Account</button>
          </div>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
