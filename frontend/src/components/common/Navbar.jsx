import React from 'react';
import { Menu, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'HOD':
      case 'ADMIN': return 'badge-hod';
      case 'TEACHER': return 'badge-teacher';
      case 'STUDENT': return 'badge-student';
      default: return '';
    }
  };

  return (
    <header className="navbar">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn btn-outline btn-sm"
          style={{ padding: '0.4rem', border: 'none' }}
          aria-label="Toggle navigation"
        >
          <Menu size={22} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
          Smart Attendance
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <Link to="/profile" className="flex items-center gap-2" style={{ color: 'inherit' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}
              </div>
              <div style={{ display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>{user.name || user.username}</div>
                <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  {user.role}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              title="Logout"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
