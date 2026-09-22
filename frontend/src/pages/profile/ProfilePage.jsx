import React from 'react';
import { User, ShieldCheck, Mail, Hash, BookOpen, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2>User Account Profile</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Details and credentials associated with your Smart Attendance institutional account.
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{user?.name || user?.username}</h3>
            <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ marginTop: '0.25rem' }}>
              {user?.role} ACCOUNT
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Mail size={18} color="var(--color-text-muted)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block' }}>Email Address</span>
              <span style={{ fontWeight: 600 }}>{user?.email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={18} color="var(--color-text-muted)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block' }}>Username</span>
              <span style={{ fontWeight: 600 }}>{user?.username}</span>
            </div>
          </div>

          {user?.identifier && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Hash size={18} color="var(--color-text-muted)" />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block' }}>
                  {user?.role === 'STUDENT' ? 'Student Registration Number' : 'Employee ID'}
                </span>
                <span style={{ fontWeight: 600 }}>{user?.identifier}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={18} color="var(--color-text-muted)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block' }}>Authentication Status</span>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Active (JWT Stateless Token)</span>
            </div>
          </div>
        </div>

        <hr style={{ margin: '1.75rem 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <strong>Institutional Note:</strong> Password updates and department transfers must be authorized by the system administrator.
        </div>
      </div>
    </div>
  );
}
