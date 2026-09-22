import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// HOD Pages
import HodDashboardPage from './pages/hod/HodDashboardPage';
import HodTimetablePage from './pages/hod/HodTimetablePage';
import HodStudentsPage from './pages/hod/HodStudentsPage';
import AddStudentPage from './pages/hod/AddStudentPage';
import HodPendingStudentsPage from './pages/hod/HodPendingStudentsPage';
import HodFaceEnrollmentPage from './pages/hod/HodFaceEnrollmentPage';
import ClassesPage from './pages/hod/ClassesPage';

// Teacher Pages
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import MyStudentsPage from './pages/teacher/MyStudentsPage';
import CreateSessionPage from './pages/teacher/CreateSessionPage';
import ActiveSessionPage from './pages/teacher/ActiveSessionPage';

// Student Pages
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import MarkAttendancePage from './pages/student/MarkAttendancePage';
import StudentHistoryPage from './pages/student/StudentHistoryPage';

// Shared Pages
import AttendanceReportsPage from './pages/reports/AttendanceReportsPage';
import ProfilePage from './pages/profile/ProfilePage';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication status..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'HOD') {
    return <Navigate to="/hod/dashboard" replace />;
  }
  if (user?.role === 'TEACHER') {
    return <Navigate to="/teacher/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/student/attendance/:token" element={<MarkAttendancePage />} />

      {/* Root redirect based on role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected Routes nested in DashboardLayout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* HOD Routes */}
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HodDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/timetable"
          element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HodTimetablePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/students"
          element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HodStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/students/new"
          element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <AddStudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/add-student"
          element={<Navigate to="/hod/students/new" replace />}
        />
        <Route
          path="/hod/pending-students"
          element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HodPendingStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/face-enrollment"
          element={
            <ProtectedRoute allowedRoles={['HOD']}>
              <HodFaceEnrollmentPage />
            </ProtectedRoute>
          }
        />

        {/* Backward Compatibility Redirects */}
        <Route path="/admin/*" element={<Navigate to="/hod/dashboard" replace />} />
        <Route path="/students" element={<Navigate to="/hod/students" replace />} />

        {/* Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD']}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD']}>
              <MyStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/session/new"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD']}>
              <CreateSessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/session/active"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD']}>
              <ActiveSessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance/sessions"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'HOD']}>
              <ActiveSessionPage />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'HOD']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance/mark"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'HOD']}>
              <MarkAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance/history"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'HOD']}>
              <StudentHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Routes */}
        <Route
          path="/classes"
          element={
            <ProtectedRoute allowedRoles={['HOD', 'TEACHER', 'STUDENT']}>
              <ClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['HOD', 'TEACHER']}>
              <AttendanceReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['HOD', 'TEACHER', 'STUDENT']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
