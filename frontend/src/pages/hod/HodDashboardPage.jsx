import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Camera,
  UserCheck,
  Plus
} from 'lucide-react';
import { dashboardApi, studentApi, timetableApi, reportApi, sessionApi } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatTime } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export default function HodDashboardPage() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [capacity, setCapacity] = useState({ currentCount: 0, enrolledFaceCount: 0, maxCapacity: 20 });
  const [todaySession, setTodaySession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    loadHodData();
  }, []);

  const loadHodData = async () => {
    try {
      setLoading(true);
      const [statsRes, stuRes, capRes, pendRes, todayRes] = await Promise.allSettled([
        dashboardApi.getAdminStats(),
        studentApi.getAll(),
        studentApi.getCapacity(),
        studentApi.getPending(),
        timetableApi.getToday()
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (stuRes.status === 'fulfilled') {
        setStudents(stuRes.value.data || []);
      }
      if (capRes.status === 'fulfilled') {
        setCapacity(capRes.value.data);
      }
      if (pendRes.status === 'fulfilled') {
        const pList = (pendRes.value.data || []).filter(p => p.status === 'PENDING');
        setPendingCount(pList.length);
      }
      if (todayRes.status === 'fulfilled' && todayRes.value.data) {
        setTodaySession(todayRes.value.data.session);
        setSessionRecords(todayRes.value.data.records || []);
      }
    } catch (err) {
      toastError('Failed to load HOD department dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDepartmentReport = async () => {
    try {
      setExporting(true);
      if (todaySession) {
        const res = await sessionApi.downloadExcel(todaySession.id);
        const blob = new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Department_Attendance_Session_${todaySession.id}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        success('HOD Department Attendance Audit (.xlsx) downloaded successfully!');
      } else {
        window.open(reportApi.getExportUrl({}), '_blank');
      }
    } catch (err) {
      toastError('Failed to export Excel report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading HOD Departmental Metrics & Audit Records..." />;

  const studentCount = students.length;
  const enrolledFaceCount = capacity.enrolledFaceCount || students.filter(s => s.faceEnrolled).length;
  const verifiedTodayCount = sessionRecords.filter((r) => r.status === 'PRESENT').length;
  const rejectedTodayCount = sessionRecords.filter((r) => r.status === 'REJECTED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Head of Department (HOD) Portal
            </h1>
            <span className="badge badge-hod">Computer Science & Engineering</span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Academic surveillance, student roster capacity, biometric face enrollment, and live geofence verification.
          </p>
        </div>

        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button onClick={loadHodData} className="btn btn-outline btn-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link to="/hod/students" className="btn btn-primary btn-sm">
            <Plus size={15} /> Manage Students
          </Link>
          <Link to="/hod/pending-students" className="btn btn-outline btn-sm">
            <UserCheck size={15} /> Pending Requests {pendingCount > 0 && `(${pendingCount})`}
          </Link>
          <Link to="/hod/face-enrollment" className="btn btn-outline btn-sm">
            <Camera size={15} /> Face Biometrics
          </Link>
          <button
            onClick={handleExportDepartmentReport}
            disabled={exporting}
            className="btn btn-outline btn-sm"
          >
            <FileSpreadsheet size={15} />
            <span>{exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <StatCard
          title="Student Roster Capacity"
          value={`${studentCount} / 20`}
          icon={GraduationCap}
          color="blue"
          subtext={studentCount >= 20 ? 'Max capacity reached' : `${20 - studentCount} seats remaining`}
        />
        <StatCard
          title="Biometrics Enrolled"
          value={`${enrolledFaceCount} / 20`}
          icon={Camera}
          color="green"
          subtext={`${studentCount - enrolledFaceCount} pending face capture`}
        />
        <StatCard
          title="Curriculum Courses"
          value={stats?.totalCourses || 6}
          icon={BookOpen}
          color="cyan"
          subtext="6 Master Scheduled Subjects"
        />
        <StatCard
          title="Department Faculty"
          value={stats?.totalTeachers || 1}
          icon={Users}
          color="purple"
          subtext="1 Assigned Class Instructor"
        />
      </div>

      {/* Empty State Banner if 0 students */}
      {studentCount === 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)', background: '#f8fafc' }}>
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="flex items-center gap-3">
              <GraduationCap size={36} color="var(--color-primary)" />
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                  No students currently enrolled in the department
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  As HOD, you can enroll students manually one-by-one (up to 20) or approve student self-registration requests.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/hod/students" className="btn btn-primary btn-sm">
                + Enroll First Student
              </Link>
              {pendingCount > 0 && (
                <Link to="/hod/pending-students" className="btn btn-outline btn-sm">
                  Review Pending ({pendingCount})
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Session Status Banner */}
      {todaySession && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div className="flex items-center gap-2">
                <h3 style={{ fontSize: '1.15rem' }}>
                  Active Lecture Session: {todaySession.courseName || todaySession.className}
                </h3>
                <StatusBadge status={todaySession.status} />
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                🕒 {formatTime(todaySession.startTime)} - {formatTime(todaySession.endTime)} &nbsp;|&nbsp;
                📍 {todaySession.roomNumber || 'Room 101'} &nbsp;|&nbsp;
                🎯 Allowed Radius: {todaySession.allowedRadius || 50}m &nbsp;|&nbsp;
                Coordinates: ({todaySession.latitude?.toFixed(4)}, {todaySession.longitude?.toFixed(4)})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)' }}>
                  {verifiedTodayCount} Verified Present
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                  {rejectedTodayCount} Verification Rejections
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Student Attendance Activity Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Today's Student Attendance Activity ({sessionRecords.length} Records)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Real-time student check-in log with 2-factor location and face verification audit status.
            </p>
          </div>
          {todaySession && (
            <button
              type="button"
              onClick={handleExportDepartmentReport}
              disabled={exporting}
              className="btn btn-outline btn-sm"
            >
              <FileSpreadsheet size={16} />
              <span>{exporting ? 'Generating Excel...' : 'Download Today\'s Excel'}</span>
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Date</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Session Time</th>
                <th>Location Verification</th>
                <th>Face Verification</th>
                <th>Attendance Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {sessionRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No student attendance recorded for today's session yet. Records will appear here in real time as students verify.
                  </td>
                </tr>
              ) : (
                sessionRecords.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{r.studentNumber}</td>
                    <td style={{ fontSize: '0.85rem' }}>{r.sessionDate || todaySession?.sessionDate}</td>
                    <td style={{ fontSize: '0.85rem' }}>{todaySession?.courseName || r.className}</td>
                    <td style={{ fontSize: '0.85rem' }}>{todaySession?.teacherName || 'Faculty'}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {formatTime(todaySession?.startTime)} - {formatTime(todaySession?.endTime)}
                    </td>
                    <td>
                      <span className={`badge ${r.locationStatus === 'VERIFIED' ? 'badge-present' : 'badge-rejected'}`}>
                        {r.locationStatus || 'VERIFIED'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.faceStatus === 'VERIFIED' ? 'badge-present' : 'badge-rejected'}`}>
                        {r.faceStatus || 'VERIFIED'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {r.attendanceTime ? formatTime(r.attendanceTime) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Student Audit Roster Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Department Student Roster ({studentCount} Students)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Live verification telemetry, biometric enrollment status, and student contact details.
            </p>
          </div>
          <Link to="/hod/students" className="btn btn-outline btn-sm">
            View Full Management
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Face Status</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    No students currently enrolled in the department roster.
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{s.studentNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{s.email}</td>
                    <td style={{ fontSize: '0.85rem' }}>{s.department}</td>
                    <td>
                      {s.faceEnrolled ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.75rem' }}>
                          ✓ FACE ENROLLED
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-warning)', fontWeight: 700, fontSize: '0.75rem' }}>
                          ⚠ NOT ENROLLED
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#2563eb',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        {s.accountStatus || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
