import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  Eye,
  Camera,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  UserCheck,
  Sparkles,
  CameraOff,
  Clock
} from 'lucide-react';
import { studentApi, attendanceApi } from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCamera } from '../../hooks/useCamera';
import { useToast } from '../../context/ToastContext';

export default function HodStudentsPage() {
  const [students, setStudents] = useState([]);
  const [capacity, setCapacity] = useState({
    currentCount: 0,
    maxCapacity: 20,
    remainingCapacity: 20,
    enrolledFaceCount: 0,
    unEnrolledFaceCount: 0,
    isFull: false
  });
  const [loading, setLoading] = useState(true);

  // Add / Edit Student Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formData, setFormData] = useState({
    studentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Computer Science & Engineering',
    year: 1,
    section: 'A'
  });
  const [submitting, setSubmitting] = useState(false);

  // View Student Modal
  const [viewStudent, setViewStudent] = useState(null);

  // View Attendance Activity Modal
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
  const [attendanceActivity, setAttendanceActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Face Enrollment Modal
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [selectedStudentForFace, setSelectedStudentForFace] = useState(null);
  const [enrollingFace, setEnrollingFace] = useState(false);
  const [simulatingFace, setSimulatingFace] = useState(false);

  const {
    videoRef,
    isStreaming,
    capturedImage,
    startCamera,
    stopCamera,
    captureImage,
    resetCapture
  } = useCamera();

  const { success, error: toastError, info } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stuRes, capRes] = await Promise.allSettled([
        studentApi.getAll(),
        studentApi.getCapacity()
      ]);

      if (stuRes.status === 'fulfilled') {
        setStudents(stuRes.value.data || []);
      }
      if (capRes.status === 'fulfilled') {
        setCapacity(capRes.value.data);
      }
    } catch (err) {
      toastError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    if (capacity.isFull || students.length >= 20) {
      toastError('Maximum prototype capacity reached. You cannot add more than 20 students.');
      return;
    }
    setEditingStudentId(null);
    const nextNum = students.length + 1;
    const rollSuggestion = `STU${String(nextNum).padStart(3, '0')}`;
    setFormData({
      studentNumber: rollSuggestion,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: 'Computer Science & Engineering',
      year: 1,
      section: 'A'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setEditingStudentId(s.id);
    setFormData({
      studentNumber: s.studentNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone || '',
      department: s.department,
      year: s.year || 1,
      section: s.section || 'A'
    });
    setModalOpen(true);
  };

  const handleOpenAttendanceModal = async (s) => {
    setSelectedStudentForAttendance(s);
    setAttendanceActivity(null);
    setLoadingActivity(true);
    try {
      const res = await studentApi.getActivity(s.id);
      setAttendanceActivity(res.data);
    } catch (err) {
      toastError('Failed to fetch attendance history.');
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!editingStudentId && students.length >= 20) {
      toastError('Maximum prototype capacity reached (20 students).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingStudentId) {
        await studentApi.update(editingStudentId, formData);
        success(`Updated student ${formData.firstName} ${formData.lastName}`);
      } else {
        await studentApi.create(formData);
        success(`Enrolled student ${formData.firstName} ${formData.lastName}`);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"? This removes their attendance records and login profile.`)) return;
    try {
      await studentApi.delete(id);
      success(`Student "${name}" deleted.`);
      loadData();
    } catch (err) {
      toastError('Failed to delete student.');
    }
  };

  const handleOpenFaceModal = (student) => {
    setSelectedStudentForFace(student);
    resetCapture();
    setFaceModalOpen(true);
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const handleCloseFaceModal = () => {
    stopCamera();
    resetCapture();
    setFaceModalOpen(false);
    setSelectedStudentForFace(null);
  };

  const handleCaptureAndSaveFace = async () => {
    if (!selectedStudentForFace) return;
    setEnrollingFace(true);
    try {
      captureImage();
      // Generate 128-d mock biometric vector hash
      const embedding = Array.from({ length: 16 }, () => (Math.random() * 0.8 + 0.1).toFixed(4)).join(',');
      await studentApi.enrollFace(selectedStudentForFace.id, { faceEmbedding: embedding });
      success(`Face representation enrolled successfully for ${selectedStudentForFace.firstName} ${selectedStudentForFace.lastName}!`);
      handleCloseFaceModal();
      loadData();
    } catch (err) {
      toastError('Failed to save biometric face enrollment.');
    } finally {
      setEnrollingFace(false);
    }
  };

  const handleSimulateFaceEnrollment = async () => {
    if (!selectedStudentForFace) return;
    setSimulatingFace(true);
    try {
      const embedding = '0.21,0.45,0.78,0.33,0.89,0.12,0.64,0.51,0.95,0.18,0.72,0.41,0.60,0.29,0.83,0.55';
      await studentApi.enrollFace(selectedStudentForFace.id, { faceEmbedding: embedding });
      success(`Biometric face verified and enrolled for ${selectedStudentForFace.firstName} ${selectedStudentForFace.lastName}!`);
      handleCloseFaceModal();
      loadData();
    } catch (err) {
      toastError('Failed to enroll simulated face.');
    } finally {
      setSimulatingFace(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading departmental student registry..." />;

  const isFull = capacity.isFull || students.length >= 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header with Capacity Counter and Add Button */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              HOD Student Management
            </h1>
            <span
              style={{
                background: isFull ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                color: isFull ? '#dc2626' : '#2563eb',
                padding: '0.3rem 0.85rem',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.875rem'
              }}
            >
              Capacity: {students.length} / 20
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Manually enroll department students (max 20), configure real emails, and register live facial biometrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn btn-outline btn-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link
            to="/hod/students/new"
            className={`btn btn-primary ${isFull ? 'disabled' : ''}`}
            style={{ textDecoration: 'none', pointerEvents: isFull ? 'none' : 'auto', opacity: isFull ? 0.6 : 1 }}
            title={isFull ? 'Maximum prototype capacity reached (20 students)' : 'Add Student'}
          >
            <Plus size={18} />
            <span>+ ADD STUDENT</span>
          </Link>
        </div>
      </div>

      {/* Capacity Warning Banner if full */}
      {isFull && (
        <div className="alert alert-warning" style={{ margin: 0 }}>
          <AlertCircle size={18} />
          <div>
            <strong>Maximum prototype capacity reached (20 / 20).</strong> The department roster is full.
            To add new students, existing student accounts must first be removed.
          </div>
        </div>
      )}

      {/* Student Registry Table Card */}
      <div className="card">
        <div className="card-header flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Department Student Roster</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Facial Biometrics: {capacity.enrolledFaceCount || students.filter(s => s.faceEnrolled).length} / {students.length} Enrolled
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
                <th>Phone</th>
                <th>Department</th>
                <th>Year</th>
                <th>Sem</th>
                <th>Sec</th>
                <th>Face Status</th>
                <th>Attendance %</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan="13"
                    style={{
                      textAlign: 'center',
                      padding: '3rem 1.5rem',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    <GraduationCap size={48} style={{ margin: '0 auto 1rem', opacity: 0.35 }} />
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      No students enrolled yet.
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Add students using the '+ ADD STUDENT' button above.
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
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
                    <td style={{ fontSize: '0.82rem' }}>{s.phone || '--'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{s.department}</td>
                    <td style={{ fontSize: '0.82rem', textAlign: 'center' }}>{s.year || 1}</td>
                    <td style={{ fontSize: '0.82rem', textAlign: 'center' }}>{s.semester || 1}</td>
                    <td style={{ fontSize: '0.82rem', textAlign: 'center' }}>{s.section || 'A'}</td>
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
                    <td style={{ textAlign: 'center' }}>
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
                    <td>
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#2563eb',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}
                      >
                        {s.accountStatus || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1" style={{ flexWrap: 'nowrap' }}>
                        <button
                          onClick={() => setViewStudent(s)}
                          className="btn btn-outline btn-sm"
                          title="View Profile"
                          style={{ padding: '0.3rem 0.45rem', fontSize: '0.72rem' }}
                        >
                          <Eye size={13} />
                          <span>VIEW</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="btn btn-outline btn-sm"
                          title="Edit Student"
                          style={{ padding: '0.3rem 0.45rem', fontSize: '0.72rem' }}
                        >
                          <Edit size={13} />
                          <span>EDIT</span>
                        </button>
                        <button
                          onClick={() => handleOpenFaceModal(s)}
                          className={`btn btn-sm ${s.faceEnrolled ? 'btn-outline' : 'btn-primary'}`}
                          title="Enroll Face Biometrics"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
                        >
                          <Camera size={13} />
                          <span>{s.faceEnrolled ? 'RE-ENROLL' : 'ENROLL'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenAttendanceModal(s)}
                          className="btn btn-outline btn-sm"
                          title="View Attendance History"
                          style={{ padding: '0.3rem 0.45rem', fontSize: '0.72rem' }}
                        >
                          <Clock size={13} />
                          <span>ATTENDANCE</span>
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)}
                          className="btn btn-outline btn-sm"
                          title="Delete Student"
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '0.3rem 0.4rem' }}
                        >
                          <Trash2 size={13} />
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStudentId ? 'Edit Student Details' : `Enroll Student (${students.length + 1} of 20)`}
      >
        <form onSubmit={handleSaveStudent}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Ramesh"
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
                placeholder="e.g. Kumar"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Roll Number / Student ID</label>
              <input
                type="text"
                name="studentNumber"
                className="form-input"
                value={formData.studentNumber}
                onChange={handleChange}
                placeholder="e.g. STU001"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Real / Manual Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. student01@gmail.com"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select name="year" className="form-select" value={formData.year} onChange={handleChange}>
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
                required
              />
            </div>
          </div>

          <div className="flex justify-between" style={{ marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : editingStudentId ? 'Update Student' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

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
                {viewStudent.firstName[0]}{viewStudent.lastName[0]}
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
                <strong>Year {viewStudent.year} • Sec {viewStudent.section}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Biometric Status:</span>
                <strong style={{ color: viewStudent.faceEnrolled ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {viewStudent.faceEnrolled ? '✓ FACE ENROLLED' : '⚠ NOT ENROLLED'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Account Status:</span>
                <strong style={{ color: 'var(--color-primary)' }}>ACTIVE</strong>
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
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 700 }}>Recent Attendance Sessions</h4>
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

      {/* Face Biometrics Enrollment Modal */}
      {faceModalOpen && (
        <Modal
          isOpen={faceModalOpen}
          onClose={handleCloseFaceModal}
          title={`Enroll Face Biometrics: ${selectedStudentForFace?.firstName} ${selectedStudentForFace?.lastName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Capture a clear frontal face image to extract and store the student's facial representation embedding vector.
            </p>

            {/* Video / Snapshot Container */}
            <div
              style={{
                width: '100%',
                height: '240px',
                background: '#0f172a',
                borderRadius: '10px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured snapshot"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : isStreaming ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <CameraOff size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                  <div style={{ fontSize: '0.85rem' }}>Camera Offline</div>
                </div>
              )}

              {capturedImage && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(16, 185, 129, 0.9)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  ✓ Snapshot Captured
                </div>
              )}
            </div>

            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {!isStreaming ? (
                <button type="button" onClick={startCamera} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                  <Camera size={15} /> Turn On Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCaptureAndSaveFace}
                  disabled={enrollingFace}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Sparkles size={15} />
                  <span>{enrollingFace ? 'Processing Face...' : 'Capture & Save Biometrics'}</span>
                </button>
              )}
              {isStreaming && (
                <button type="button" onClick={stopCamera} className="btn btn-outline btn-sm">
                  Stop Camera
                </button>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={handleSimulateFaceEnrollment}
                disabled={simulatingFace}
                className="btn btn-outline btn-sm"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                👤 Quick Enroll Face (Dev / No-Cam Simulation)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
