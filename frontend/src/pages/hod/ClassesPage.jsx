import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Users, Calendar, Clock, MapPin, UserPlus } from 'lucide-react';
import { classApi, courseApi, teacherApi, studentApi } from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    className: '',
    courseId: '',
    teacherId: '',
    room: 'Hall 101',
    scheduleDay: 'Monday',
    startTime: '09:00:00',
    endTime: '10:30:00'
  });
  const [submitting, setSubmitting] = useState(false);

  // Roster / Enrollment Modal
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [rosterLoading, setRosterLoading] = useState(false);

  const { success, error: toastError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classRes, courseRes, teacherRes, studentRes] = await Promise.all([
        classApi.getAll(),
        courseApi.getAll(),
        teacherApi.getAll(),
        studentApi.getAll()
      ]);
      setClasses(classRes.data);
      setCourses(courseRes.data);
      setTeachers(teacherRes.data);
      setAllStudents(studentRes.data);

      if (courseRes.data.length > 0 && !formData.courseId) {
        setFormData((p) => ({ ...p, courseId: courseRes.data[0].id }));
      }
      if (teacherRes.data.length > 0 && !formData.teacherId) {
        setFormData((p) => ({ ...p, teacherId: teacherRes.data[0].id }));
      }
    } catch (err) {
      toastError('Failed to load class data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: name === 'courseId' || name === 'teacherId' ? (value ? parseInt(value, 10) : '') : value
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
        endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime
      };
      await classApi.create(payload);
      success(`Class section "${formData.className}" created.`);
      setCreateModalOpen(false);
      setFormData({
        className: '',
        courseId: courses[0]?.id || '',
        teacherId: teachers[0]?.id || '',
        room: 'Hall 101',
        scheduleDay: 'Monday',
        startTime: '09:00:00',
        endTime: '10:30:00'
      });
      const res = await classApi.getAll();
      setClasses(res.data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create class section.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete class section "${name}"?`)) return;
    try {
      await classApi.delete(id);
      success(`Class "${name}" deleted.`);
      const res = await classApi.getAll();
      setClasses(res.data);
    } catch (err) {
      toastError('Failed to delete class.');
    }
  };

  const openRoster = async (cls) => {
    setSelectedClass(cls);
    setRosterModalOpen(true);
    setRosterLoading(true);
    try {
      const res = await classApi.getEnrolledStudents(cls.id);
      setEnrolledStudents(res.data || []);
    } catch (err) {
      toastError('Failed to load enrolled students.');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentToEnroll || !selectedClass) return;
    try {
      await classApi.enrollStudent(selectedClass.id, parseInt(selectedStudentToEnroll, 10));
      success('Student enrolled successfully.');
      setSelectedStudentToEnroll('');
      const res = await classApi.getEnrolledStudents(selectedClass.id);
      setEnrolledStudents(res.data || []);
      // refresh classes list to update student count
      const cRes = await classApi.getAll();
      setClasses(cRes.data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to enroll student.');
    }
  };

  const handleUnenrollStudent = async (studentId, studentName) => {
    if (!window.confirm(`Unenroll ${studentName} from this class?`)) return;
    try {
      await classApi.unenrollStudent(selectedClass.id, studentId);
      success(`${studentName} unenrolled.`);
      const res = await classApi.getEnrolledStudents(selectedClass.id);
      setEnrolledStudents(res.data || []);
      const cRes = await classApi.getAll();
      setClasses(cRes.data);
    } catch (err) {
      toastError('Failed to unenroll student.');
    }
  };

  if (loading) return <LoadingSpinner message="Loading academic classes..." />;

  // Filter available students not already enrolled
  const enrolledIds = new Set(enrolledStudents.map((s) => s.id));
  const availableToEnroll = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2>Academic Class Sections</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Schedule course sections, link instructors, rooms, and enroll students.
          </p>
        </div>
        <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Create Class Section</span>
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Class Section</th>
                <th>Course</th>
                <th>Assigned Faculty</th>
                <th>Schedule & Room</th>
                <th>Enrolled</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No class sections configured. Create one to begin scheduling sessions.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cls.className}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{cls.courseCode}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {cls.courseName}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{cls.teacherName || 'Not assigned'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {cls.teacherEmail}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1" style={{ fontSize: '0.85rem' }}>
                        <Calendar size={13} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{cls.scheduleDay || 'Mon-Fri'}</span>
                      </div>
                      <div className="flex items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <Clock size={13} />
                        <span>{cls.startTime?.substring(0, 5)} - {cls.endTime?.substring(0, 5)}</span>
                        {cls.room && <span>• {cls.room}</span>}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => openRoster(cls)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Users size={14} />
                        <span>{cls.enrolledCount ?? cls.enrolledStudentsCount ?? 0} Students</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(cls.id, cls.className)}
                        className="btn btn-danger btn-sm"
                        title="Delete Class Section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Class Section Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Class Section"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Class Section Name *</label>
            <input
              type="text"
              name="className"
              className="form-control"
              placeholder="e.g. CS101 - Section A"
              value={formData.className}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Course *</label>
              <select
                name="courseId"
                className="form-control"
                value={formData.courseId}
                onChange={handleChange}
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Faculty *</label>
              <select
                name="teacherId"
                className="form-control"
                value={formData.teacherId}
                onChange={handleChange}
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.employeeNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Schedule Day</label>
              <select
                name="scheduleDay"
                className="form-control"
                value={formData.scheduleDay}
                onChange={handleChange}
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Classroom / Hall</label>
              <input
                type="text"
                name="room"
                className="form-control"
                placeholder="e.g. Room 302 / Seminar Hall"
                value={formData.room}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                name="startTime"
                className="form-control"
                value={formData.startTime.substring(0, 5)}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                name="endTime"
                className="form-control"
                value={formData.endTime.substring(0, 5)}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Roster & Enrollment Modal */}
      <Modal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        title={`Class Roster: ${selectedClass?.className || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Enroll Student Form */}
          <form onSubmit={handleEnrollStudent} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Enroll New Student</label>
              <select
                className="form-control"
                value={selectedStudentToEnroll}
                onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
              >
                <option value="">Select a student to enroll...</option>
                {availableToEnroll.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentNumber} - {s.firstName} {s.lastName} ({s.department})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedStudentToEnroll}
              style={{ whiteSpace: 'nowrap' }}
            >
              <UserPlus size={16} />
              <span>Enroll</span>
            </button>
          </form>

          {/* Enrolled Students Table */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {rosterLoading ? (
              <LoadingSpinner message="Fetching roster..." />
            ) : enrolledStudents.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                No students enrolled in this section yet.
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll #</th>
                    <th>Name</th>
                    <th>Dept</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((s) => (
                    <tr key={s.id}>
                      <td><span className="badge badge-info">{s.studentNumber}</span></td>
                      <td style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</td>
                      <td style={{ fontSize: '0.85rem' }}>{s.department}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleUnenrollStudent(s.id, `${s.firstName} ${s.lastName}`)}
                          className="btn btn-danger btn-sm"
                          title="Unenroll"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setRosterModalOpen(false)}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
