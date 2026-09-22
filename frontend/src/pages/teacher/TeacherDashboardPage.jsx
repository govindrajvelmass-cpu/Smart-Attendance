import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  PlusCircle,
  Play,
  Square,
  AlertCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { dashboardApi, sessionApi } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime, formatTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getTeacherStats();
      setStats(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teacher dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async (sessionId) => {
    try {
      await sessionApi.stop(sessionId);
      success('Attendance session stopped and closed successfully.');
      loadDashboard();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to stop session.');
    }
  };

  if (loading) return <LoadingSpinner message="Loading faculty portal..." />;

  if (error) {
    return (
      <div className="alert alert-danger">
        <AlertCircle size={20} />
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2>Faculty Dashboard</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Manage lecture schedules, launch geofenced attendance sessions, and monitor attendance records.
          </p>
        </div>
        <Link to="/teacher/session/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Start New Attendance</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid-cols-4">
        <StatCard
          title="Assigned Classes"
          value={stats?.totalClasses ?? 0}
          icon={Calendar}
          color="blue"
          subtext="Active teaching modules"
        />
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          color="purple"
          subtext="Across all your classes"
        />
        <StatCard
          title="Active Sessions"
          value={stats?.activeSessions ?? 0}
          icon={Clock}
          color="amber"
          subtext="Live right now"
        />
        <StatCard
          title="Overall Attendance"
          value={`${stats?.attendancePercentage ?? 0}%`}
          icon={TrendingUp}
          color="green"
          subtext={`${stats?.presentCount ?? 0} present`}
        />
      </div>

      {/* Active Attendance Sessions Banner / Cards */}
      {stats?.activeSessionsList && stats.activeSessionsList.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--color-primary)', background: '#f8faff' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                <Clock size={20} />
                Live Attendance Session in Progress
              </h3>
              <span className="card-description">Students are currently permitted to record their attendance</span>
            </div>
            <span className="badge badge-active">Live</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.activeSessionsList.map((session) => (
              <div
                key={session.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {session.className} ({session.courseCode})
                  </h4>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Started: {formatTime(session.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> Allowed Radius: {session.allowedRadius}m
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> Check-ins: {session.presentCount + session.lateCount} / {session.totalEnrolled}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to="/teacher/session/active" className="btn btn-outline btn-sm">
                    View Real-time Check-ins
                  </Link>
                  <button
                    onClick={() => handleStopSession(session.id)}
                    className="btn btn-danger btn-sm"
                  >
                    <Square size={14} />
                    <span>Close Session</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes Overview Grid */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">My Assigned Classes</h3>
          <span className="card-description">Classes scheduled for this semester</span>
        </div>

        <div className="grid-cols-2">
          {stats?.classes && stats.classes.length > 0 ? (
            stats.classes.map((cls) => (
              <div
                key={cls.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  background: '#fff'
                }}
              >
                <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                  <span className="badge badge-teacher">{cls.courseCode}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {cls.scheduleDay}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{cls.className}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {cls.courseName}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '1rem', color: 'var(--color-text-muted)' }}>
                  <span>Room: {cls.room || 'TBA'}</span>
                  <span>Time: {formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {cls.enrolledCount} Enrolled Students
                  </span>
                  <Link to={`/teacher/session/new?classId=${cls.id}`} className="btn btn-primary btn-sm">
                    <Play size={14} />
                    <span>Start Session</span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--color-text-muted)', padding: '1.5rem' }}>
              No classes currently assigned to your profile.
            </p>
          )}
        </div>
      </div>

      {/* Recent Check-ins Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Student Submissions</h3>
          <span className="card-description">Latest verified attendance records across your lectures</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Class</th>
                <th>Distance</th>
                <th>Recorded At</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentAttendance && stats.recentAttendance.length > 0 ? (
                stats.recentAttendance.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 600 }}>{rec.studentName}</td>
                    <td>{rec.studentNumber}</td>
                    <td>{rec.className}</td>
                    <td>{rec.distanceFromClass != null ? `${rec.distanceFromClass.toFixed(1)} m` : '--'}</td>
                    <td>{formatDateTime(rec.attendanceTime)}</td>
                    <td>
                      <StatusBadge status={rec.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {rec.remarks || '--'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No student attendance records recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
