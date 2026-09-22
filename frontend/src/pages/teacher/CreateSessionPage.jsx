import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play,
  MapPin,
  Navigation,
  Clock,
  AlertCircle,
  CheckCircle2,
  Mail,
  FileSpreadsheet,
  Users,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles,
  StopCircle,
  RefreshCw
} from 'lucide-react';
import { classApi, sessionApi, attendanceApi, emailApi } from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ClassroomMapPicker from '../../components/attendance/ClassroomMapPicker';
import StatusBadge from '../../components/common/StatusBadge';
import { formatTime } from '../../utils/formatters';

export default function CreateSessionPage() {
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  // 5 Steps: 1: Details, 2: Geofence, 3: Review & Activate, 4: Recipient Email, 5: Live Audit
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(initialClassId);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [classroomName, setClassroomName] = useState('Room 101');

  // Location states
  const [latitude, setLatitude] = useState(12.9715987);
  const [longitude, setLongitude] = useState(77.5945627);
  const [allowedRadius, setAllowedRadius] = useState(50);

  // Session & Audit states
  const [createdSession, setCreatedSession] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [emailResult, setEmailResult] = useState(null);
  const [smtpInfo, setSmtpInfo] = useState(null);
  const [liveRecords, setLiveRecords] = useState([]);

  // UI status
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState('');

  const { location: browserLoc, loading: locLoading, getLocation } = useGeolocation();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
    loadSmtpStatus();
  }, []);

  const loadSmtpStatus = async () => {
    try {
      const res = await emailApi.getStatus();
      setSmtpInfo(res.data);
    } catch (e) {
      // ignore
    }
  };

  // Update coordinates when GPS is acquired
  useEffect(() => {
    if (browserLoc) {
      setLatitude(browserLoc.latitude);
      setLongitude(browserLoc.longitude);
      success(`Classroom coordinates set to your GPS location (${browserLoc.latitude.toFixed(5)}, ${browserLoc.longitude.toFixed(5)})`);
    }
  }, [browserLoc]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await classApi.getAll();
      setClasses(res.data || []);
      if (!classId && res.data?.length > 0) {
        setClassId(res.data[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id.toString() === classId.toString());

  // Handle map position update
  const handleMapLocationChange = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  // Step 3 -> Activate Session
  const handleActivateSession = async () => {
    if (!classId) {
      setError('Please select a class.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        classId: Number(classId),
        sessionDate: sessionDate,
        startTime: startTime,
        endTime: endTime,
        latitude: Number(latitude),
        longitude: Number(longitude),
        allowedRadius: Number(allowedRadius)
      };

      const res = await sessionApi.create(payload);
      setCreatedSession(res.data);
      success('Attendance session activated successfully!');

      // Load enrolled recipients for step 4
      try {
        const recRes = await sessionApi.getRecipients(res.data.id);
        setRecipients(recRes.data || []);
      } catch (e) {
        // fallback
      }

      setCurrentStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to activate attendance session.';
      setError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4 -> Send Emails
  const handleSendEmails = async () => {
    if (!createdSession || sendingEmails) return;
    setSendingEmails(true);
    try {
      const res = await sessionApi.sendEmails(createdSession.id);
      setEmailResult(res.data);
      const sentCount = res.data.successfullySent ?? res.data.successfulSent ?? 0;
      const failedCount = res.data.failed ?? 0;

      if (sentCount > 0 && failedCount === 0) {
        success(`Dispatched ${sentCount} attendance emails via SMTP!`);
      } else if (sentCount > 0 && failedCount > 0) {
        info(`Partial delivery: ${sentCount} sent, ${failedCount} failed.`);
      } else if (res.data.smtpStatus === 'SMTP Configuration Error') {
        toastError(res.data.message || 'SMTP credentials missing. Please configure backend/.env.');
      } else {
        toastError(res.data.message || 'Failed to send attendance emails.');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to send attendance emails.');
    } finally {
      setSendingEmails(false);
    }
  };

  // Step 5 -> Poll Live Records
  const loadLiveAudit = async () => {
    if (!createdSession) return;
    try {
      const res = await attendanceApi.getBySession(createdSession.id);
      setLiveRecords(res.data || []);
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    let timer;
    if (currentStep === 5 && createdSession) {
      loadLiveAudit();
      timer = setInterval(loadLiveAudit, 3000);
    }
    return () => clearInterval(timer);
  }, [currentStep, createdSession]);

  // Step 5 -> Download Apache POI Excel Report
  const handleDownloadExcel = async () => {
    if (!createdSession) return;
    setExportingExcel(true);
    try {
      const res = await sessionApi.downloadExcel(createdSession.id);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `Session_${createdSession.id}_Attendance_Report.xlsx`);
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('Apache POI Attendance Excel report downloaded successfully!');
    } catch (err) {
      toastError('Failed to download Excel report.');
    } finally {
      setExportingExcel(false);
    }
  };

  // Close Session
  const handleCloseSession = async () => {
    if (!createdSession) return;
    try {
      await sessionApi.stop(createdSession.id);
      success('Attendance session closed.');
      navigate('/teacher/dashboard');
    } catch (err) {
      toastError('Failed to close session.');
    }
  };

  if (loading) return <LoadingSpinner message="Initializing session creation wizard..." />;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Step Progress Bar */}
      <div className="card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {[
            { step: 1, label: '1. Class Details' },
            { step: 2, label: '2. Geofence Map' },
            { step: 3, label: '3. Review & Activate' },
            { step: 4, label: '4. Student Emails' },
            { step: 5, label: '5. Live Audit & POI Excel' }
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isDone = currentStep > item.step;
            return (
              <div
                key={item.step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isActive
                      ? 'var(--color-primary)'
                      : isDone
                      ? 'var(--color-success)'
                      : 'var(--color-border)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {isDone ? '✓' : item.step}
                </div>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ margin: 0 }}>
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* STEP 1: Session Details */}
      {currentStep === 1 && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Step 1: Manual Session Details</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Select the academic subject from the master curriculum and set timetable timings.
              </span>
            </div>
            <span className="badge badge-active">Lecture Setup</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Subject / Course Module</label>
              <select
                className="form-select"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className} ({c.courseCode} — {c.scheduleDay})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Session Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Classroom / Hall Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={classroomName}
                  onChange={(e) => setClassroomName(e.target.value)}
                  placeholder="e.g. Room 101, Lab A"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-primary"
              >
                <span>Next: Classroom Geofence Location</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Classroom Geofence Location */}
      {currentStep === 2 && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Step 2: Interactive Geofence Map</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Click on the Leaflet map or drag the pin to set classroom coordinates and choose allowed radius.
              </span>
            </div>
            <span className="badge badge-active">Haversine GPS Limit</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Interactive Leaflet Map */}
            <ClassroomMapPicker
              latitude={Number(latitude)}
              longitude={Number(longitude)}
              radius={Number(allowedRadius)}
              onLocationChange={handleMapLocationChange}
              interactive={true}
              height="340px"
            />

            {/* GPS Location Button */}
            <div>
              <button
                type="button"
                onClick={getLocation}
                disabled={locLoading}
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
              >
                <Navigation size={15} />
                <span>{locLoading ? 'Acquiring GPS...' : 'Use My Current Teacher Location'}</span>
              </button>
            </div>

            {/* Dynamic Coordinates Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Classroom Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  className="form-input"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Classroom Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  className="form-input"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Radius Selector */}
            <div className="form-group">
              <label className="form-label">Allowed Geofence Radius</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {[30, 50, 75, 100, 150].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAllowedRadius(r)}
                    className={`btn btn-sm ${allowedRadius === r ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    {r}m {r === 50 && '(Default)'}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="10"
                max="500"
                className="form-input"
                value={allowedRadius}
                onChange={(e) => setAllowedRadius(Number(e.target.value))}
                placeholder="Custom Radius (meters)"
              />
              <small style={{ color: 'var(--color-text-muted)' }}>
                Students farther than {allowedRadius} meters from this pin will be rejected by backend Haversine validation.
              </small>
            </div>

            <div className="flex justify-between" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-outline"
              >
                <ChevronLeft size={18} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn btn-primary"
              >
                <span>Next: Review & Activate</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Activate Session */}
      {currentStep === 3 && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Step 3: Review & Activate Session</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Confirm session parameters and activate live check-in for enrolled students.
              </span>
            </div>
            <span className="badge badge-active">Ready to Launch</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Course / Module:</span>
                  <strong>{selectedClass?.className || 'Selected Class'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Classroom:</span>
                  <strong>{classroomName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Date & Timing:</span>
                  <strong>{sessionDate} • {startTime} - {endTime}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Geofence Boundary:</span>
                  <strong>{allowedRadius} meters radius</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Classroom Coordinates:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>({Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)})</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Verification Modes:</span>
                  <strong style={{ color: 'var(--color-success)' }}>2-Factor: GPS Haversine + Face Biometrics</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-between" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-outline"
              >
                <ChevronLeft size={18} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleActivateSession}
                disabled={submitting}
                className="btn btn-primary btn-lg"
              >
                <Play size={18} />
                <span>{submitting ? 'Activating Session...' : 'Activate Attendance Session'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Recipient Preview & Send Email */}
      {currentStep === 4 && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Step 4: Recipient Student Preview & Email</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Preview actual enrolled students with real HOD-entered emails and send session attendance invitations.
              </span>
            </div>
            <span className="badge badge-active">Session #{createdSession?.id} Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <strong>Enrolled Students ({recipients.length}):</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                  Students eligible to mark attendance for this lecture.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSendEmails}
                disabled={sendingEmails || recipients.length === 0}
                className="btn btn-primary btn-sm"
              >
                <Mail size={16} />
                <span>{sendingEmails ? 'Dispatching Emails...' : 'Send Attendance Email'}</span>
              </button>
            </div>

            {/* Real Email Dispatch Status Message */}
            {sendingEmails ? (
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <RefreshCw size={18} className="animate-spin" color="var(--color-primary)" />
                <div>
                  <strong>Email Status:</strong> Sending...
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    Connecting to SMTP server and submitting individual attendance invitations...
                  </div>
                </div>
              </div>
            ) : emailResult ? (
              <div
                style={{
                  background: (emailResult.successfullySent > 0 && emailResult.failed === 0)
                    ? 'rgba(16, 185, 129, 0.12)'
                    : emailResult.successfullySent > 0
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid ' + ((emailResult.successfullySent > 0 && emailResult.failed === 0)
                    ? 'var(--color-success)'
                    : emailResult.successfullySent > 0
                    ? 'var(--color-warning)'
                    : 'var(--color-danger)'),
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem'
                }}
              >
                <strong>Email Status:</strong> {emailResult.smtpStatus}
                <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Total Recipients: {emailResult.totalRecipients || recipients.length} • Successfully Sent: {emailResult.successfullySent ?? emailResult.successfulSent ?? 0} • Failed: {emailResult.failed ?? 0}
                </div>
                {emailResult.message && (
                  <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: 'var(--color-text-muted)' }}>
                    {emailResult.message}
                  </div>
                )}
                {emailResult.failedRecipients && emailResult.failedRecipients.length > 0 && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                    <strong>Failed Deliveries:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      {emailResult.failedRecipients.map((f, i) => (
                        <li key={i}>{f.email}: {f.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: smtpInfo?.configured ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid ' + (smtpInfo?.configured ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.4)'),
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem'
                }}
              >
                <strong>Email Status:</strong> {smtpInfo?.configured ? 'Ready to Send' : 'SMTP Configuration Error'}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  {smtpInfo?.configured
                    ? `SMTP server (${smtpInfo.host}:${smtpInfo.port}) ready. Sender: ${smtpInfo.sender}`
                    : (smtpInfo?.message || 'SMTP credentials missing. Please set MAIL_USERNAME and MAIL_PASSWORD in backend/.env to deliver real emails.')}
                </div>
              </div>
            )}

            {/* Recipients Table */}
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Manual Email (HOD Entered)</th>
                    <th>Department</th>
                    <th>Face Enrollment</th>
                    <th>Email Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        No enrolled students in this class roster. Add students in the HOD portal.
                      </td>
                    </tr>
                  ) : (
                    recipients.map((stu) => {
                      const delivery = emailResult?.results?.find(s => s.email === stu.email || String(s.studentId) === String(stu.studentId)) ||
                                       emailResult?.studentStatuses?.find(s => s.email === stu.email);
                      const isSent = delivery && (delivery.status === 'sent' || delivery.status === 'SENT');
                      const isFailed = delivery && !isSent;
                      return (
                        <tr key={stu.studentId}>
                          <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{stu.rollNumber}</td>
                          <td style={{ fontWeight: 600 }}>{stu.name}</td>
                          <td style={{ fontSize: '0.85rem' }}>{stu.email}</td>
                          <td style={{ fontSize: '0.85rem' }}>{stu.department}</td>
                          <td>
                            {stu.faceEnrolled ? (
                              <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.75rem' }}>
                                ✓ ENROLLED
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-warning)', fontWeight: 700, fontSize: '0.75rem' }}>
                                ⚠ NOT ENROLLED
                              </span>
                            )}
                          </td>
                          <td>
                            {isSent ? (
                              <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.75rem' }}>
                                ✓ SENT
                              </span>
                            ) : isFailed ? (
                              <span style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.75rem' }} title={delivery.error || delivery.status}>
                                ⚠ FAILED
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                Ready to Send
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="btn btn-primary"
              >
                <span>Proceed to Live Check-in Audit & Excel</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Live Check-in Audit & POI Excel */}
      {currentStep === 5 && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Step 5: Live Attendance Audit & POI Excel Report</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Real-time student verification telemetry with 25-column Apache POI Excel audit export.
              </span>
            </div>

            <div className="flex gap-2">
              <button onClick={loadLiveAudit} className="btn btn-outline btn-sm">
                <RefreshCw size={15} /> Refresh Audit
              </button>
              <button
                onClick={handleDownloadExcel}
                disabled={exportingExcel}
                className="btn btn-primary btn-sm"
              >
                <FileSpreadsheet size={16} />
                <span>{exportingExcel ? 'Generating Excel...' : 'Download Apache POI Excel (.xlsx)'}</span>
              </button>
              <button
                onClick={handleCloseSession}
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                <StopCircle size={15} />
                <span>Close Session</span>
              </button>
            </div>
          </div>

          {/* Live Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total Enrolled Roster</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{recipients.length}</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-success)' }}>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Verified Present</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                {liveRecords.filter((r) => r.status === 'PRESENT').length}
              </div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-danger)' }}>
              <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Verification Rejected</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
                {liveRecords.filter((r) => r.status === 'REJECTED').length}
              </div>
            </div>
          </div>

          {/* Live Check-in Audit Table */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Check-in Time</th>
                  <th>GPS Distance</th>
                  <th>Location Status</th>
                  <th>Face Biometrics</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {liveRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                      <Clock size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                      <div style={{ fontWeight: 600 }}>Awaiting student check-ins...</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        When students mark attendance on their portal, real-time records will stream in automatically.
                      </div>
                    </td>
                  </tr>
                ) : (
                  liveRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{rec.studentNumber}</td>
                      <td style={{ fontWeight: 600 }}>{rec.studentName}</td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(rec.attendanceTime).toLocaleTimeString()}</td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {rec.distanceFromClass != null ? `${rec.distanceFromClass.toFixed(1)}m` : '--'}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: rec.locationStatus === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {rec.locationStatus}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: rec.faceStatus === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {rec.faceStatus}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={rec.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
