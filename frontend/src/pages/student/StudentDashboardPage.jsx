import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MapPin,
  CheckSquare,
  Download,
  ShieldCheck,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { dashboardApi, attendanceApi } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, formatTime, formatPercentage } from '../../utils/formatters';

export default function StudentDashboardPage() {
  const [stats, setStats] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState(null);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, todayRes] = await Promise.allSettled([
        dashboardApi.getStudentStats(),
        attendanceApi.getStudentToday()
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (todayRes.status === 'fulfilled') {
        setTodayData(todayRes.value.data);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTodayExcel = async () => {
    try {
      setExportingExcel(true);
      const res = await attendanceApi.downloadTodayExcel();
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Today_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success("Today's attendance Excel report downloaded successfully!");
    } catch (err) {
      toastError("Failed to download today's attendance Excel report.");
    } finally {
      setExportingExcel(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading student portal..." />;

  const isLowAttendance = stats?.totalAttendanceRecords > 0 && stats?.attendancePercentage < 75;
  const todaySessionsList = todayData?.todaySessions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Student Attendance Hub</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Monitor your course attendance percentages, check-in history, and live classroom sessions.
          </p>
        </div>

        {/* Download Today's Attendance Button (Requirement 12) */}
        <button
          type="button"
          onClick={handleDownloadTodayExcel}
          disabled={exportingExcel}
          className="btn btn-outline btn-sm"
        >
          <Download size={16} />
          <span>{exportingExcel ? 'Generating Excel...' : "Download Today's Attendance"}</span>
        </button>
      </div>

      {/* Warning Alert if Attendance < 75% */}
      {isLowAttendance && (
        <div className="alert alert-warning">
          <AlertTriangle size={22} />
          <div>
            <strong>Low Attendance Warning!</strong> Your current overall attendance is{' '}
            <strong>{formatPercentage(stats.attendancePercentage)}</strong>, which is below the mandatory 75% requirement. Make sure to attend all upcoming lectures.
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-cols-4">
        <StatCard
          title="Attendance Rate"
          value={formatPercentage(stats?.attendancePercentage)}
          icon={TrendingUp}
          color={stats?.attendancePercentage >= 75 ? 'green' : 'amber'}
          subtext={stats?.attendancePercentage >= 75 ? 'Meets 75% target' : 'Action required'}
        />
        <StatCard
          title="Enrolled Classes"
          value={stats?.totalClasses ?? 0}
          icon={Calendar}
          color="blue"
          subtext="Current semester modules"
        />
        <StatCard
          title="Sessions Present"
          value={stats?.presentCount ?? 0}
          icon={CheckCircle2}
          color="green"
          subtext={`${stats?.lateCount ?? 0} late check-ins`}
        />
        <StatCard
          title="Sessions Absent"
          value={stats?.absentCount ?? 0}
          icon={AlertTriangle}
          color="red"
          subtext="Missed lectures"
        />
      </div>

      {/* TODAY'S SESSIONS & ATTENDANCE STATUS TABLE (Requirement 12) */}
      <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
        <div className="card-header flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 className="card-title flex items-center gap-2">
              <Calendar size={18} color="var(--color-primary)" />
              Today's Sessions & Attendance Status
            </h3>
            <span className="card-description">
              Daily schedule, attendance check-in status, and 2-factor verification results.
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownloadTodayExcel}
            disabled={exportingExcel}
            className="btn btn-outline btn-sm"
          >
            <Download size={14} />
            <span>Excel (.xlsx)</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject / Class</th>
                <th>Teacher</th>
                <th>Session Time</th>
                <th>Attendance Status</th>
                <th>Location Verification</th>
                <th>Face Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {todaySessionsList.length > 0 ? (
                todaySessionsList.map((s) => {
                  const isPresent = s.attendanceStatus === 'PRESENT';
                  const isMarked = s.marked;
                  return (
                    <tr key={s.sessionId}>
                      <td style={{ fontWeight: 600 }}>
                        {s.subject} ({s.courseCode})
                      </td>
                      <td>{s.teacher}</td>
                      <td>{s.startTime} - {s.endTime}</td>
                      <td>
                        <span className={`badge ${isPresent ? 'badge-present' : isMarked ? 'badge-late' : 'badge-absent'}`}>
                          {s.attendanceStatus === 'PRESENT' ? 'Present' : s.attendanceStatus}
                        </span>
                      </td>
                      <td>
                        {s.locationVerification === 'VERIFIED' ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.85rem' }}>
                            ✓ VERIFIED
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            {s.locationVerification || 'NOT ATTEMPTED'}
                          </span>
                        )}
                      </td>
                      <td>
                        {s.faceVerification === 'VERIFIED' ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.85rem' }}>
                            ✓ VERIFIED
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            {s.faceVerification || 'NOT ATTEMPTED'}
                          </span>
                        )}
                      </td>
                      <td>
                        {isMarked ? (
                          <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                            Recorded
                          </span>
                        ) : (
                          <Link
                            to={`/student/attendance/mark?sessionId=${s.sessionId}`}
                            className="btn btn-primary btn-sm"
                          >
                            <CheckSquare size={14} />
                            <span>Mark Now</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No sessions scheduled for your enrolled classes today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrolled Courses Progress */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">My Registered Courses</h3>
          <span className="card-description">Classes enrolled this academic term</span>
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
                <div className="flex justify-between items-center" style={{ marginBottom: '0.4rem' }}>
                  <span className="badge badge-student">{cls.courseCode}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {cls.scheduleDay}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{cls.className}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  {cls.courseName}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginTop: '0.85rem', color: 'var(--color-text-muted)' }}>
                  <span>Instructor: {cls.teacherName || 'Faculty'}</span>
                  <span>Room: {cls.room || 'TBA'}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>No enrolled classes found.</p>
          )}
        </div>
      </div>

      {/* Recent Personal Attendance Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Attendance Log</h3>
            <span className="card-description">Your latest verified attendance marks</span>
          </div>
          <Link to="/student/attendance/history" className="btn btn-outline btn-sm">
            Full History
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Course</th>
                <th>Distance to Room</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentAttendance && stats.recentAttendance.length > 0 ? (
                stats.recentAttendance.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 600 }}>{rec.className}</td>
                    <td>{rec.courseCode}</td>
                    <td>
                      {rec.distanceFromClass != null ? `${rec.distanceFromClass.toFixed(1)} m` : '--'}
                    </td>
                    <td>{formatDateTime(rec.attendanceTime)}</td>
                    <td>
                      <StatusBadge status={rec.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {rec.remarks || 'Verified'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No personal attendance records found.
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
