import React, { useState, useEffect } from 'react';
import {
  Clock,
  Square,
  Play,
  RefreshCw,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Mail,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Send,
  Edit2
} from 'lucide-react';
import { sessionApi, attendanceApi, timetableApi, classApi } from '../../services/api';
import ClassroomMapPicker from '../../components/attendance/ClassroomMapPicker';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { formatTime, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function ActiveSessionPage() {
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Map & Geofence state
  const [latitude, setLatitude] = useState(12.9715987);
  const [longitude, setLongitude] = useState(77.5945627);
  const [allowedRadius, setAllowedRadius] = useState(100);
  const [savingLocation, setSavingLocation] = useState(false);

  // Email dispatch state
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResultModal, setEmailResultModal] = useState(null);

  // Manual verify / edit record state
  const [editingRecord, setEditingRecord] = useState(null);
  const [newStatus, setNewStatus] = useState('PRESENT');
  const [newVerification, setNewVerification] = useState('VERIFIED');
  const [newRemarks, setNewRemarks] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const { success, error: toastError, info } = useToast();

  useEffect(() => {
    loadTodaySession();
  }, []);

  const loadTodaySession = async () => {
    try {
      setLoading(true);
      // First try to resolve today's timetable session
      const todayRes = await timetableApi.getToday();
      let curSession = todayRes.data?.session;

      if (!curSession) {
        // Fallback to active sessions
        const activeRes = await sessionApi.getActive();
        if (activeRes.data && activeRes.data.length > 0) {
          curSession = activeRes.data[0];
        }
      }

      setSession(curSession);

      if (curSession) {
        setLatitude(curSession.latitude || 12.9715987);
        setLongitude(curSession.longitude || 77.5945627);
        setAllowedRadius(curSession.allowedRadius || 100);

        await Promise.all([
          loadSessionRecords(curSession.id),
          loadEnrolledStudents(curSession.classId || curSession.classEntityId)
        ]);
      }
    } catch (err) {
      toastError('Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionRecords = async (sessionId) => {
    try {
      setRefreshing(true);
      const res = await attendanceApi.getBySession(sessionId);
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const loadEnrolledStudents = async (classId) => {
    if (!classId) return;
    try {
      const res = await classApi.getEnrolledStudents(classId);
      setEnrolledStudents(res.data || []);
    } catch (err) {
      console.warn('Could not load enrolled students list', err);
    }
  };

  const handleLocationPicked = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSaveGeofence = async () => {
    if (!session) return;
    try {
      setSavingLocation(true);
      const res = await sessionApi.updateLocation(session.id, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        allowedRadius: parseFloat(allowedRadius)
      });
      setSession(res.data);
      success(`Classroom geofence updated! Radius: ${allowedRadius}m`);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update classroom geofence.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleSendEmails = async () => {
    if (!session) return;
    try {
      setSendingEmail(true);
      const res = await sessionApi.sendEmails(session.id);
      setEmailResultModal(res.data);
      if (res.data.smtpConfigured && (res.data.successfullySent > 0 || res.data.smtpStatus === 'SENT')) {
        success(`Dispatched attendance emails to ${res.data.successfullySent} students via SMTP!`);
      } else if (res.data.smtpStatus === 'SMTP Configuration Error' || !res.data.smtpConfigured) {
        toastError(res.data.message || 'SMTP credentials missing. Please configure backend/.env.');
      } else {
        toastError(res.data.message || 'Failed to dispatch emails.');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to dispatch emails.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!session) return;
    try {
      const res = await sessionApi.downloadExcel(session.id);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Session_${session.id}_${session.courseName || 'Class'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      success('Official Apache POI Excel audit report (.xlsx) downloaded successfully!');
    } catch (err) {
      toastError('Failed to export Excel report.');
    }
  };

  const handleToggleSessionStatus = async () => {
    if (!session) return;
    try {
      if (session.status === 'ACTIVE') {
        await sessionApi.stop(session.id);
        success('Attendance session closed.');
      } else {
        await sessionApi.start(session.id);
        success('Attendance session started.');
      }
      loadTodaySession();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to change session status.');
    }
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setNewStatus(rec.status);
    setNewVerification(rec.teacherVerification || 'VERIFIED');
    setNewRemarks(rec.remarks || '');
  };

  const handleSaveStatus = async () => {
    if (!editingRecord) return;
    try {
      setSavingEdit(true);
      await attendanceApi.update(editingRecord.id, {
        status: newStatus,
        remarks: newRemarks
      });
      if (newVerification) {
        await attendanceApi.verify(editingRecord.id, newVerification);
      }
      success(`Updated attendance for ${editingRecord.studentName}`);
      setEditingRecord(null);
      loadSessionRecords(session.id);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update record.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading attendance session & classroom geofence..." />;
  }

  if (!session) {
    return (
      <div>
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <Clock size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
          <h2>No Active Attendance Session Found</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 450, margin: '0.5rem auto 1.5rem' }}>
            There is currently no active session for today. You can start today's scheduled class session or configure one.
          </p>
          <button onClick={loadTodaySession} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <RefreshCw size={16} /> Refresh Today's Timetable
          </button>
        </div>
      </div>
    );
  }

  // Calculate audit statistics
  const totalEnrolled = enrolledStudents.length || 20;
  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const rejectedCount = records.filter(r => r.status === 'REJECTED').length;
  const attendanceRate = totalEnrolled > 0 ? ((presentCount / totalEnrolled) * 100).toFixed(1) : '0.0';

  return (
    <div>
      {/* Header Bar */}
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Today's Session: {session.courseName || session.className || 'Lecture'}
            </h1>
            <StatusBadge status={session.status} />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            📅 {session.sessionDate} &nbsp;|&nbsp; 🕒 {formatTime(session.startTime)} - {formatTime(session.endTime)} &nbsp;|&nbsp; 📍 {session.roomNumber || 'Room 101'}
          </p>
        </div>

        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button
            onClick={() => loadSessionRecords(session.id)}
            disabled={refreshing}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSendEmails}
            disabled={sendingEmail}
            className="btn btn-outline btn-sm"
            style={{ borderColor: 'var(--color-info)', color: 'var(--color-info-dark, #0284c7)' }}
          >
            <Mail size={15} />
            <span>{sendingEmail ? 'Sending...' : 'Send Student Emails'}</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#16a34a', color: '#16a34a' }}
          >
            <FileSpreadsheet size={15} />
            <span>Download Audit (.xlsx)</span>
          </button>

          <button
            onClick={handleToggleSessionStatus}
            className={`btn btn-sm ${session.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
          >
            {session.status === 'ACTIVE' ? (
              <>
                <Square size={15} /> Close Session
              </>
            ) : (
              <>
                <Play size={15} /> Reopen Session
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Enrolled</div>
          <div className="stat-value">{totalEnrolled}</div>
          <div className="stat-subtext">Class Batch Strength</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verified Present</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{presentCount}</div>
          <div className="stat-subtext">Passed GPS + Face</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verification Rejected</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{rejectedCount}</div>
          <div className="stat-subtext">Failed geofence or face match</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Live Attendance Rate</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{attendanceRate}%</div>
          <div className="stat-subtext">{presentCount} of {totalEnrolled} recorded</div>
        </div>
      </div>

      {/* Interactive Map & Geofence Selector Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--color-primary)" />
              Classroom Interactive Geofence Map
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Click or drag the marker to pin the exact classroom coordinates. The blue circle illustrates the allowed student verification radius.
            </p>
          </div>
          <button
            onClick={handleSaveGeofence}
            disabled={savingLocation}
            className="btn btn-primary btn-sm"
          >
            <Sliders size={15} />
            <span>{savingLocation ? 'Saving...' : 'Save Geofence to Session'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '1.25rem' }}>
          {/* Leaflet Map */}
          <div>
            <ClassroomMapPicker
              latitude={latitude}
              longitude={longitude}
              radius={allowedRadius}
              onLocationChange={handleLocationPicked}
              interactive={true}
              height="320px"
            />
          </div>

          {/* Controls Panel */}
          <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Classroom Latitude</label>
              <input
                type="number"
                step="0.000001"
                className="form-control"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Classroom Longitude</label>
              <input
                type="number"
                step="0.000001"
                className="form-control"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Allowed Radius (Meters)</label>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem' }}>{allowedRadius} m</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={allowedRadius}
                onChange={(e) => setAllowedRadius(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div className="flex justify-between" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                <span>20m</span>
                <span>100m (Recommended)</span>
                <span>500m</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              🔒 Students must be inside the {allowedRadius}m boundary and pass facial matching to be marked PRESENT.
            </div>
          </div>
        </div>
      </div>

      {/* Live Check-In Audit Table */}
      <div className="card">
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Student Attendance & Verification Audit Records</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Real-time check-in log including GPS Haversine verification and Facial Recognition biometrics.
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Total Verified Check-Ins: <strong>{records.length}</strong>
          </span>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Attendance Status</th>
                <th>GPS Verification</th>
                <th>Face Biometrics</th>
                <th>Teacher Review</th>
                <th>Recorded At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No check-ins recorded yet for this session.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 600 }}>{rec.studentRollNumber || rec.studentNumber || '--'}</td>
                    <td>{rec.studentName}</td>
                    <td>
                      <StatusBadge status={rec.status} />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {rec.locationStatus === 'VERIFIED' ? (
                          <ShieldCheck size={16} color="var(--color-success)" />
                        ) : (
                          <ShieldAlert size={16} color="var(--color-danger)" />
                        )}
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {rec.locationStatus || (rec.distanceFromClass <= (session.allowedRadius || 100) ? 'VERIFIED' : 'FAILED')}
                        </span>
                        {rec.distanceFromClass != null && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            ({rec.distanceFromClass.toFixed(1)}m)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {rec.faceStatus === 'VERIFIED' ? (
                          <CheckCircle2 size={16} color="var(--color-success)" />
                        ) : (
                          <AlertCircle size={16} color="var(--color-danger)" />
                        )}
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {rec.faceStatus || 'VERIFIED'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${rec.teacherVerification === 'VERIFIED' ? 'badge-present' : rec.teacherVerification === 'REJECTED' ? 'badge-rejected' : 'badge-closed'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {rec.teacherVerification || 'PENDING'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {formatTime(rec.attendanceTime)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openEditModal(rec)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Review / Override Status"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Dispatch Result Modal */}
      {emailResultModal && (
        <Modal
          isOpen={true}
          onClose={() => setEmailResultModal(null)}
          title="Attendance Notification Dispatch Report"
        >
          <div>
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Status: {emailResultModal.smtpStatus === 'SENT' || emailResultModal.successfullySent > 0
                  ? '✅ Dispatched via SMTP'
                  : '❌ ' + (emailResultModal.message || emailResultModal.smtpStatus || 'Delivery Failed')}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Total Students: <strong>{emailResultModal.totalRecipients || 0}</strong> • Successfully Sent: <strong>{emailResultModal.successfullySent ?? 0}</strong> • Failed: <strong>{emailResultModal.failed ?? 0}</strong>
              </div>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Dispatch Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(emailResultModal.students || emailResultModal.studentStatuses || emailResultModal.results || []).map((s, idx) => {
                    const isSuccess = s.status === 'SENT' || s.status === 'sent';
                    return (
                      <tr key={idx}>
                        <td>{s.name || s.studentName || ('Student #' + s.studentId)}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.email}</td>
                        <td>
                          <span className={`badge ${isSuccess ? 'badge-present' : 'badge-absent'}`} style={{ fontSize: '0.68rem' }} title={s.error}>
                            {isSuccess ? 'SENT' : (s.error ? `FAILED: ${s.error}` : 'FAILED')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end" style={{ marginTop: '1.25rem' }}>
              <button onClick={() => setEmailResultModal(null)} className="btn btn-primary btn-sm">
                Close Report
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Override / Verification Modal */}
      {editingRecord && (
        <Modal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          title={`Attendance Audit Review - ${editingRecord.studentName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Attendance Status</label>
              <select
                className="form-control"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="LATE">LATE</option>
                <option value="REJECTED">REJECTED</option>
                <option value="EXCUSED">EXCUSED</option>
              </select>
            </div>

            <div>
              <label className="form-label">Teacher Verification Decision</label>
              <select
                className="form-control"
                value={newVerification}
                onChange={(e) => setNewVerification(e.target.value)}
              >
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="MANUAL_OVERRIDE">MANUAL_OVERRIDE</option>
              </select>
            </div>

            <div>
              <label className="form-label">Audit Remarks</label>
              <textarea
                className="form-control"
                rows="3"
                value={newRemarks}
                onChange={(e) => setNewRemarks(e.target.value)}
                placeholder="Enter justification or audit observations..."
              />
            </div>

            <div className="flex justify-end gap-2" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditingRecord(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={savingEdit}
                onClick={handleSaveStatus}
              >
                {savingEdit ? 'Saving...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
