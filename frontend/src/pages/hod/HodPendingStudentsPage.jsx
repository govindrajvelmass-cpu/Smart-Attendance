import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import { studentApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

export default function HodPendingStudentsPage() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const { success, error: toastError, info } = useToast();

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getPending();
      setPendingStudents(res.data || []);
    } catch (err) {
      toastError('Failed to load pending student requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    setProcessingId(id);
    try {
      await studentApi.approvePending(id);
      success(`Approved and enrolled student: ${name || 'Student'}`);
      loadPendingRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve student request.';
      toastError(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to reject registration for "${name}"?`)) return;
    setProcessingId(id);
    try {
      await studentApi.rejectPending(id);
      info(`Rejected registration for ${name}`);
      loadPendingRequests();
    } catch (err) {
      toastError('Failed to reject registration request.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading pending student registrations..." />;

  const pendingList = pendingStudents.filter((p) => p.status === 'PENDING');
  const processedList = pendingStudents.filter((p) => p.status !== 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Pending Student Registration Requests
            </h1>
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {pendingList.length} Pending
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Review self-registration requests. Approving a student automatically allocates their roll number and enrolls them in department courses (up to 20 student capacity).
          </p>
        </div>

        <button onClick={loadPendingRequests} className="btn btn-outline btn-sm">
          <RefreshCw size={15} /> Refresh Requests
        </button>
      </div>

      {/* Pending Table */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem' }}>New Registration Requests ({pendingList.length})</h3>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Mobile</th>
                <th>Request Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Review Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    <Clock size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>No pending registration requests.</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      When new students submit their email on the registration page, their requests will appear here for your review.
                    </div>
                  </td>
                </tr>
              ) : (
                pendingList.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.fullName || 'Student Applicant'}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{req.email}</td>
                    <td style={{ fontSize: '0.85rem' }}>{req.department || 'Computer Science'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{req.phone || '--'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#d97706',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        PENDING APPROVAL
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req.id, req.fullName || req.email)}
                          disabled={processingId === req.id}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.35rem 0.75rem' }}
                        >
                          <UserCheck size={14} />
                          <span>Approve & Enroll</span>
                        </button>
                        <button
                          onClick={() => handleReject(req.id, req.fullName || req.email)}
                          disabled={processingId === req.id}
                          className="btn btn-outline btn-sm"
                          style={{
                            padding: '0.35rem 0.65rem',
                            color: 'var(--color-danger)',
                            borderColor: 'var(--color-danger)'
                          }}
                        >
                          <UserX size={14} />
                          <span>Reject</span>
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

      {/* Historical Processed Requests */}
      {processedList.length > 0 && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
              Processed Request History ({processedList.length})
            </h3>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Processed On</th>
                  <th>Final Decision</th>
                </tr>
              </thead>
              <tbody>
                {processedList.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fullName}</td>
                    <td>{item.email}</td>
                    <td>{item.department}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {item.processedAt ? new Date(item.processedAt).toLocaleDateString() : '--'}
                    </td>
                    <td>
                      {item.status === 'APPROVED' ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.8rem' }}>
                          ✓ APPROVED
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.8rem' }}>
                          ✗ REJECTED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
