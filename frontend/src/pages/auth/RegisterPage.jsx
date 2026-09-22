import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STUDENT',
    firstName: '',
    lastName: '',
    identifier: '',
    department: 'Computer Science & Engineering',
    year: 1,
    section: 'A',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await register(formData);
      success(`Registration successful! Logged in as ${user.name || user.username}`);
      navigate(user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please check your information.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e2e8f0 100%)'
      }}
    >
      <div className="card" style={{ maxWidth: 540, width: '100%', padding: '2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
            <UserPlus size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create an Account</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Join Smart Attendance Management System
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="alert alert-info" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <span>ℹ️ Student Self-Registration. (Faculty accounts are provisioned exclusively by the Department HOD).</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                {formData.role === 'STUDENT' ? 'Student Number / Roll No' : 'Employee ID'}
              </label>
              <input
                type="text"
                name="identifier"
                className="form-input"
                placeholder={formData.role === 'STUDENT' ? 'e.g. STU-2026-101' : 'e.g. EMP-2026'}
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                name="department"
                className="form-input"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {formData.role === 'STUDENT' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Year of Study</label>
                <select
                  name="year"
                  className="form-select"
                  value={formData.year}
                  onChange={handleChange}
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input
                  type="text"
                  name="section"
                  className="form-input"
                  value={formData.section}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <UserPlus size={18} />}
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
