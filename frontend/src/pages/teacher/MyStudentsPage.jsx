import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  UserCheck
} from 'lucide-react';
import { studentApi } from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

export default function MyStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // View Profile Modal
  const [viewStudent, setViewStudent] = useState(null);

  // View Attendance History Modal
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
  const [attendanceActivity, setAttendanceActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const { error: toastError } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getAll();
      setStudents(res.data || []);
    } catch (err) {
      toastError('Failed to load student roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAttendanceModal = async (s) => {
    setSelectedStudentForAttendance(s);
    setAttendanceActivity(null);
    setLoadingActivity(true);
    try {
      const res = await studentApi.getActivity(s.id);
      setAttendanceActivity(res.data);
    } catch (err) {
      toastError('Failed to fetch student attendance activity.');
    } finally {
      setLoadingActivity(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const rollNo = (s.studentNumber || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    return fullName.includes(term) || rollNo.includes(term) || email.includes(term);
  });

  if (loading) {
    return <LoadingSpinner message="Loading course students..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.2rem' }}>
              My Enrolled Students
            </h1>
            <span
              style={{
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {students.length} Total Students
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Students registered by the Head of Department and enrolled into your active courses and sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 34, fontSize: '0.85rem', height: 38 }}
            />
          </div>
          <button onClick={loadStudents} className="btn btn-outline btn-sm">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Student Roster Card */}
      <div className="card">
        <div className="card-header flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Course Student Roster</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Facial Biometrics Registered: {students.filter(s => s.faceEnrolled).length} / {students.length}
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Email</th>
                <th>Department</th>
                <th>Year / Sec</th>
                <th>Face Status</th>
                <th>Attendance %</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: 'center',
                      padding: '3rem 1.5rem',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    <GraduationCap size={48} style={{ margin: '0 auto 1rem', opacity: 0.35 }} />
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      {students.length === 0
                        ? 'No students enrolled in your classes yet. Contact HOD to enroll students.'
                        : 'No students matching your search criteria.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                      {s.course && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>
                          {s.course}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                        {s.studentNumber}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{s.email}</td>
                    <td style={{ fontSize: '0.82rem' }}>{s.department}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      Year {s.year || 1} • Sec {s.section || 'A'}
                    </td>
                    <td>
                      {s.faceEnrolled ? (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#059669',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <CheckCircle2 size={12} /> ENROLLED
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#d97706',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <XCircle size={12} /> NOT ENROLLED
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: (s.attendancePercentage || 0) >= 75 ? '#059669' : '#dc2626'
                        }}
                      >
                        {s.attendancePercentage != null ? s.attendancePercentage : 0}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setViewStudent(s)}
                          className="btn btn-outline btn-sm"
                          title="View Profile"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
                        >
                          <Eye size={13} />
                          <span>VIEW PROFILE</span>
                        </button>
                        <button
                          onClick={() => handleOpenAttendanceModal(s)}
                          className="btn btn-outline btn-sm"
                          title="View Attendance Activity"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
                        >
                          <Clock size={13} />
                          <span>ATTENDANCE</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Profile Modal */}
      {viewStudent && (
        <Modal isOpen={Boolean(viewStudent)} onClose={() => setViewStudent(null)} title="Student Profile Overview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex items-center gap-3" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.25rem'
                }}
              >
                {viewStudent.firstName?.[0]}{viewStudent.lastName?.[0]}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>
                  {viewStudent.firstName} {viewStudent.lastName}
                </h3>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {viewStudent.studentNumber}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Email:</span>
                <strong>{viewStudent.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Mobile:</span>
                <strong>{viewStudent.phone || '--'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Department:</span>
                <strong>{viewStudent.department}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Year & Section:</span>
                <strong>Year {viewStudent.year || 1} • Sec {viewStudent.section || 'A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Semester:</span>
                <strong>Semester {viewStudent.semester || 1}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Biometrics:</span>
                <strong style={{ color: viewStudent.faceEnrolled ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {viewStudent.faceEnrolled ? '✓ FACE ENROLLED' : '⚠ NOT ENROLLED'}
                </strong>
              </div>
            </div>

            <div className="flex justify-end" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={() => setViewStudent(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Attendance Activity Modal */}
      {selectedStudentForAttendance && (
        <Modal
          isOpen={Boolean(selectedStudentForAttendance)}
          onClose={() => {
            setSelectedStudentForAttendance(null);
            setAttendanceActivity(null);
          }}
          title={`Attendance History — ${selectedStudentForAttendance.firstName} ${selectedStudentForAttendance.lastName} (${selectedStudentForAttendance.studentNumber})`}
        >
          {loadingActivity ? (
            <LoadingSpinner message="Fetching attendance history and audit logs..." />
          ) : attendanceActivity ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Attendance Rate</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: (attendanceActivity.attendancePercentage || 0) >= 75 ? '#059669' : '#dc2626' }}>
                    {attendanceActivity.attendancePercentage || 0}%
                  </span>
                </div>
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>Present</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                    {attendanceActivity.presentCount || 0}
                  </span>
                </div>
                <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <span style={{ fontSize: '0.75rem', color: '#991b1b', display: 'block' }}>Absent</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c' }}>
                    {attendanceActivity.absentCount || 0}
                  </span>
                </div>
                <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.75rem', color: '#92400e', display: 'block' }}>Late</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>
                    {attendanceActivity.lateCount || 0}
                  </span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 700 }}>Attendance Records</h4>
                {(!attendanceActivity.records || attendanceActivity.records.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    No attendance records marked yet for this student.
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    <table className="table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Class</th>
                          <th>Time</th>
                          <th>GPS Status</th>
                          <th>Face Status</th>
                          <th>Verification</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceActivity.records.map((r) => (
                          <tr key={r.id}>
                            <td>{r.date || '--'}</td>
                            <td>{r.className || 'Class'}</td>
                            <td>{r.time ? new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                            <td>
                              <span style={{ color: r.locationStatus === 'VERIFIED' ? '#059669' : '#dc2626', fontWeight: 600 }}>
                                {r.locationStatus || '--'} {r.distanceFromClass != null ? `(${Math.round(r.distanceFromClass)}m)` : ''}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: r.faceStatus === 'VERIFIED' ? '#059669' : '#dc2626', fontWeight: 600 }}>
                                {r.faceStatus || '--'}
                              </span>
                            </td>
                            <td>{r.teacherVerification || 'VERIFIED'}</td>
                            <td>
                              <span
                                style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 4,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: r.status === 'PRESENT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: r.status === 'PRESENT' ? '#059669' : '#dc2626'
                                }}
                              >
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentForAttendance(null);
                    setAttendanceActivity(null);
                  }}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
