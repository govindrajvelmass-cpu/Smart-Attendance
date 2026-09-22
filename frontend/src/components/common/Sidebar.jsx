import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  CheckSquare,
  FileBarChart,
  User,
  Settings,
  X,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;

  const getNavLinks = () => {
    switch (role) {
      case 'HOD':
        return [
          { to: '/hod/dashboard', label: 'HOD Dashboard', icon: LayoutDashboard },
          { to: '/hod/students', label: 'Students', icon: GraduationCap },
          { to: '/hod/students/new', label: 'Add Student', icon: Users },
          { to: '/hod/face-enrollment', label: 'Face Enrollment', icon: User },
          { to: '/hod/timetable', label: 'Weekly Timetable', icon: Calendar },
          { to: '/attendance/sessions', label: 'Attendance Sessions', icon: Clock },
          { to: '/hod/pending-students', label: 'Pending Requests', icon: Users },
          { to: '/reports', label: 'Attendance Reports', icon: FileBarChart },
          { to: '/profile', label: 'Profile', icon: User }
        ];

      case 'TEACHER':
        return [
          { to: '/teacher/dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard },
          { to: '/teacher/students', label: 'My Students', icon: GraduationCap },
          { to: '/classes', label: 'My Assigned Classes', icon: Calendar },
          { to: '/teacher/session/new', label: 'Create Attendance Session', icon: Clock },
          { to: '/teacher/session/active', label: 'Active Session', icon: CheckSquare },
          { to: '/reports', label: 'Attendance Reports', icon: FileBarChart },
          { to: '/profile', label: 'Profile', icon: User }
        ];

      case 'STUDENT':
      default:
        return [
          { to: '/student/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
          { to: '/student/attendance/mark', label: 'Mark Attendance', icon: CheckSquare },
          { to: '/student/attendance/history', label: 'My Attendance History', icon: Clock },
          { to: '/classes', label: 'Enrolled Classes', icon: Calendar },
          { to: '/profile', label: 'Profile', icon: User }
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {isOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 35, background: 'rgba(0,0,0,0.4)' }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}
            >
              SA
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>SmartAttendance</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Location & AI Verified</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ border: 'none', padding: '0.2rem', display: 'block', md: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ padding: '1rem 0.75rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-subtle)', padding: '0.25rem 0.75rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Menu
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                  transition: 'background var(--transition-fast)'
                })}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Smart Attendance v1.0.0
        </div>
      </aside>
    </>
  );
}
