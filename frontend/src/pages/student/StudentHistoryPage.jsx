import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { attendanceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime, formatPercentage } from '../../utils/formatters';

export default function StudentHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (user?.profileId) {
      loadHistory(user.profileId);
    }
  }, [user]);

  const loadHistory = async (studentId) => {
    try {
      setLoading(true);
      const res = await attendanceApi.getByStudent(studentId);
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Retrieving your complete attendance ledger..." />;

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;
  const percentage = total > 0 ? ((present + late) / total) * 100 : 0;

  const filteredRecords = records.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2>Attendance History</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Complete record of your physical attendance sessions, geofence distances, and timeliness.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid-cols-4">
        <StatCard
          title="Attendance Rate"
          value={formatPercentage(percentage)}
          icon={TrendingUp}
          color={percentage >= 75 ? 'green' : 'amber'}
          subtext={`${present + late} attended / ${total} total`}
        />
        <StatCard
          title="Present"
          value={present}
          icon={CheckCircle2}
          color="green"
          subtext="Verified on time"
        />
        <StatCard
          title="Late"
          value={late}
          icon={Clock}
          color="amber"
          subtext="Exceeded punctuality window"
        />
        <StatCard
          title="Absent"
          value={absent}
          icon={AlertTriangle}
          color="red"
          subtext="Unattended sessions"
        />
      </div>

      {/* Filter and Records Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Attendance Records ({filteredRecords.length})</h3>
          <div className="flex gap-2">
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Course</th>
                <th>Recorded At</th>
                <th>GPS Distance</th>
                <th>Status</th>
                <th>Remarks / Validation</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.className}</td>
                    <td>{r.courseCode}</td>
                    <td>{formatDateTime(r.attendanceTime)}</td>
                    <td>
                      {r.distanceFromClass != null ? `${r.distanceFromClass.toFixed(1)} m` : '--'}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {r.remarks || 'Verified by Geofence'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    No attendance records match the selected filter.
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
