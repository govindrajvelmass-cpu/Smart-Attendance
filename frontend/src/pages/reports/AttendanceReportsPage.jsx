import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { reportApi, classApi } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime, formatPercentage } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function AttendanceReportsPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    classApi.getAll().then((res) => setClasses(res.data)).catch(() => {});
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (startDate && endDate && startDate > endDate) {
        toastError('From date cannot be after to date');
        return;
      }
      const params = {};
      if (selectedClassId) params.classId = selectedClassId;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await reportApi.getReport(params);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load attendance report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (startDate && endDate && startDate > endDate) {
      toastError('From date cannot be after to date');
      return;
    }

    const params = {};
    if (selectedClassId) params.classId = selectedClassId;
    if (selectedStatus) params.status = selectedStatus;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      setExporting(true);
      const res = await reportApi.exportReport(params);
      const blobUrl = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `attendance_report_${startDate || 'all'}_${endDate || 'all'}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toastSuccess('Attendance report downloaded');
    } catch (err) {
      toastError('Unable to download the attendance report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2>Attendance Reports & Analytics</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Filter institutional records, compute compliance metrics, and export data in CSV format.
          </p>
        </div>

        <button onClick={handleExportCsv} className="btn btn-primary" disabled={exporting}>
          <Download size={16} />
          <span>{exporting ? 'Downloading...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter by Class</label>
            <select
              className="form-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className} ({c.courseCode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Status</label>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
              <option value="EXCUSED">EXCUSED</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>From Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>To Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button onClick={fetchReport} className="btn btn-secondary" style={{ height: '42px' }}>
            <Filter size={16} />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Generating report data..." />
      ) : (
        <>
          {/* Metrics Summary Row */}
          <div className="grid-cols-4">
            <StatCard
              title="Attendance Rate"
              value={formatPercentage(report?.attendancePercentage)}
              icon={TrendingUp}
              color="green"
              subtext={`${report?.presentCount ?? 0} present`}
            />
            <StatCard
              title="Total Records"
              value={report?.totalRecords ?? 0}
              icon={FileText}
              color="blue"
              subtext="Entries matching filter"
            />
            <StatCard
              title="Late Check-ins"
              value={report?.lateCount ?? 0}
              icon={Clock}
              color="amber"
              subtext="Late arrivals"
            />
            <StatCard
              title="Absences"
              value={report?.absentCount ?? 0}
              icon={AlertTriangle}
              color="red"
              subtext="Unrecorded or absent"
            />
          </div>

          {/* Records Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Detailed Report Entries ({report?.records?.length ?? 0})</h3>
              <span className="card-description">Individual student session verifications</span>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Class / Course</th>
                    <th>Distance</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.records && report.records.length > 0 ? (
                    report.records.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                        <td>{r.studentNumber}</td>
                        <td>
                          <div>{r.className}</div>
                          <small style={{ color: 'var(--color-text-subtle)' }}>{r.courseCode}</small>
                        </td>
                        <td>{r.distanceFromClass != null ? `${r.distanceFromClass.toFixed(1)} m` : '--'}</td>
                        <td>{formatDateTime(r.attendanceTime)}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          {r.remarks || 'Verified'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                        No records match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
