import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Edit2,
  CheckCircle2,
  Sparkles,
  Plus
} from 'lucide-react';
import { timetableApi, classApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { formatTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HodTimetablePage() {
  const [timetable, setTimetable] = useState({});
  const [todayInfo, setTodayInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [editingClass, setEditingClass] = useState(null);
  const [editRoom, setEditRoom] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:00');
  const [savingEdit, setSavingEdit] = useState(false);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const [weeklyRes, todayRes] = await Promise.allSettled([
        timetableApi.getWeekly(),
        timetableApi.getToday()
      ]);

      if (weeklyRes.status === 'fulfilled') {
        setTimetable(weeklyRes.value.data || {});
      }
      if (todayRes.status === 'fulfilled') {
        setTodayInfo(todayRes.value.data);
      }
    } catch (err) {
      toastError('Failed to load department timetable.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item) => {
    setEditingClass(item);
    setEditRoom(item.roomNumber || 'Room 101');
    setEditStartTime(item.startTime ? item.startTime.substring(0, 5) : '09:00');
    setEditEndTime(item.endTime ? item.endTime.substring(0, 5) : '10:00');
  };

  const handleSaveEdit = async () => {
    if (!editingClass) return;
    try {
      setSavingEdit(true);
      await timetableApi.updateClass(editingClass.id, {
        className: editingClass.className,
        roomNumber: editRoom,
        scheduleDay: editingClass.scheduleDay,
        startTime: editStartTime,
        endTime: editEndTime
      });
      success(`Updated timetable for ${editingClass.scheduleDay}`);
      setEditingClass(null);
      loadTimetable();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update timetable entry.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading 6-Day Recurring Department Timetable..." />;

  const todayDay = todayInfo?.todayDay || 'Monday';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2">
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              6-Day Department Timetable (Mon – Sat)
            </h1>
            <span className="badge badge-active">CS Batch 2026</span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Permanent weekly recurring schedule. Today is <strong>{todayDay}</strong>.
          </p>
        </div>
      </div>

      {/* Timetable Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {DAYS_OF_WEEK.map((day) => {
          const classItem = timetable[day];
          const isToday = day.equalsIgnoreCase
            ? day.equalsIgnoreCase(todayDay)
            : day.toLowerCase() === todayDay.toLowerCase();

          return (
            <div
              key={day}
              className="card"
              style={{
                position: 'relative',
                borderTop: isToday ? '4px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: isToday ? 'var(--color-primary-light, #f0fdf4)' : 'var(--color-surface)'
              }}
            >
              {isToday && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  <Sparkles size={12} /> TODAY'S SESSION
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    letterSpacing: '0.05em'
                  }}
                >
                  {day}
                </span>
                <h3 style={{ fontSize: '1.15rem', marginTop: '0.25rem', color: 'var(--color-text-main)' }}>
                  {classItem ? classItem.courseName : 'No Scheduled Class'}
                </h3>
                {classItem && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Code: {classItem.courseCode || '--'}
                  </div>
                )}
              </div>

              {classItem ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                  <div className="flex items-center gap-2">
                    <Clock size={16} color="var(--color-primary)" />
                    <span>
                      {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)} (60 Mins)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={16} color="var(--color-primary)" />
                    <span>{classItem.roomNumber || 'Room 101'} (CS Lecture Hall)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users size={16} color="var(--color-primary)" />
                    <span>Teacher: {classItem.teacherName || 'Teacher Demo'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BookOpen size={16} color="var(--color-primary)" />
                    <span>Enrolled Learners: <strong>20 Students</strong></span>
                  </div>

                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => openEditModal(classItem)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                    >
                      <Edit2 size={13} /> Edit Schedule
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
                  No subject assigned for this timetable slot.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Class Modal */}
      {editingClass && (
        <Modal
          isOpen={true}
          onClose={() => setEditingClass(null)}
          title={`Edit Timetable Slot: ${editingClass.scheduleDay}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Subject</label>
              <input
                type="text"
                disabled
                className="form-control"
                value={editingClass.courseName}
              />
            </div>

            <div>
              <label className="form-label">Classroom / Room Number</label>
              <input
                type="text"
                className="form-control"
                value={editRoom}
                onChange={(e) => setEditRoom(e.target.value)}
                placeholder="e.g. Room 101"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditingClass(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={savingEdit}
                onClick={handleSaveEdit}
              >
                {savingEdit ? 'Saving...' : 'Save Schedule Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
