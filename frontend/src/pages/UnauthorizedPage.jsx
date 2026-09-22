import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { role } = useAuth();

  const getDashboardPath = () => {
    switch (role) {
      case 'ADMIN': return '/admin/dashboard';
      case 'TEACHER': return '/teacher/dashboard';
      case 'STUDENT': return '/student/dashboard';
      default: return '/login';
    }
  };

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem'
      }}
    >
      <div className="card" style={{ maxWidth: 440, padding: '2.5rem' }}>
        <ShieldAlert size={54} color="var(--color-danger)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          You do not have permission to view or manage this institutional resource.
        </p>
        <Link to={getDashboardPath()} className="btn btn-primary" style={{ width: '100%' }}>
          Return to Your Dashboard
        </Link>
      </div>
    </div>
  );
}
