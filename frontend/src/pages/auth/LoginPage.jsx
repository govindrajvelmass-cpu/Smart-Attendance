import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!usernameOrEmail || !password) {
      setError('Please enter both username/email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(usernameOrEmail, password);
      success(`Welcome back, ${user.name || user.username}!`);

      const destination =
        location.state?.from?.pathname ||
        (user.role === 'HOD'
          ? '/hod/dashboard'
          : user.role === 'TEACHER'
          ? '/teacher/dashboard'
          : '/student/dashboard');

      navigate(destination, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid login credentials. Please check your username and password.';
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userVal, passVal) => {
    setUsernameOrEmail(userVal);
    setPassword(passVal);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e2e8f0 100%)'
      }}
    >
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '12px',
              background: 'var(--color-primary)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <LogIn size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign In</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Smart Attendance Management System
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. hod@smartattendance.local"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <LogIn size={18} />}
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              padding: '0 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-subtle)',
              fontWeight: 600
            }}
          >
            DEMO QUICK FILL
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => fillCredentials('hod@smartattendance.local', 'Hod@123')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.4rem', fontWeight: 600 }}
          >
            HOD
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('teacher@smartattendance.local', 'Teacher@123')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.4rem', fontWeight: 600 }}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('student@gmail.com', 'Student@123')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.4rem', fontWeight: 600 }}
          >
            Student
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
