package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.response.AttendanceRecordResponse;
import com.smartattendance.backend.dto.response.AttendanceSessionResponse;
import com.smartattendance.backend.dto.response.ClassResponse;
import com.smartattendance.backend.dto.response.DashboardStatsResponse;
import com.smartattendance.backend.entity.*;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final ClassRepository classRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceSessionService sessionService;
    private final AttendanceService attendanceService;
    private final ClassService classService;

    public DashboardService(StudentRepository studentRepository,
                            TeacherRepository teacherRepository,
                            CourseRepository courseRepository,
                            ClassRepository classRepository,
                            AttendanceSessionRepository sessionRepository,
                            AttendanceRepository attendanceRepository,
                            EnrollmentRepository enrollmentRepository,
                            AttendanceSessionService sessionService,
                            AttendanceService attendanceService,
                            ClassService classService) {
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.sessionRepository = sessionRepository;
        this.attendanceRepository = attendanceRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.sessionService = sessionService;
        this.attendanceService = attendanceService;
        this.classService = classService;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getAdminDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalStudents(studentRepository.count());
        stats.setTotalTeachers(teacherRepository.count());
        stats.setTotalCourses(courseRepository.count());
        stats.setTotalClasses(classRepository.count());

        List<AttendanceSession> activeSessions = sessionRepository.findByStatus(SessionStatus.ACTIVE);
        stats.setActiveSessions(activeSessions.size());

        long totalAttendance = attendanceRepository.count();
        long present = attendanceRepository.countByStatus(AttendanceStatus.PRESENT);
        long absent = attendanceRepository.countByStatus(AttendanceStatus.ABSENT);
        long late = attendanceRepository.countByStatus(AttendanceStatus.LATE);

        stats.setTotalAttendanceRecords(totalAttendance);
        stats.setPresentCount(present);
        stats.setAbsentCount(absent);
        stats.setLateCount(late);

        double pct = totalAttendance > 0 ? ((double) (present + late) / totalAttendance) * 100.0 : 0.0;
        stats.setAttendancePercentage(Math.round(pct * 10.0) / 10.0);

        List<AttendanceRecordResponse> recent = attendanceRepository.findAll().stream()
                .sorted((a, b) -> b.getAttendanceTime().compareTo(a.getAttendanceTime()))
                .limit(10)
                .map(attendanceService::mapToResponse)
                .collect(Collectors.toList());
        stats.setRecentAttendance(recent);

        return stats;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getTeacherDashboardStats(Long teacherUserId) {
        Teacher teacher = teacherRepository.findByUser_Id(teacherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found for user: " + teacherUserId));

        DashboardStatsResponse stats = new DashboardStatsResponse();

        List<ClassEntity> classes = classRepository.findByTeacher_Id(teacher.getId());
        stats.setTotalClasses(classes.size());

        List<ClassResponse> classResponses = classes.stream()
                .map(classService::mapToResponse)
                .collect(Collectors.toList());
        stats.setClasses(classResponses);

        List<AttendanceSession> active = sessionRepository.findByTeacher_Id(teacher.getId()).stream()
                .filter(s -> s.getStatus() == SessionStatus.ACTIVE)
                .collect(Collectors.toList());
        stats.setActiveSessions(active.size());
        stats.setActiveSessionsList(active.stream().map(sessionService::mapToResponse).collect(Collectors.toList()));

        // Count unique students enrolled in teacher's classes
        long uniqueStudents = classes.stream()
                .flatMap(c -> enrollmentRepository.findByClassEntity_Id(c.getId()).stream())
                .map(e -> e.getStudent().getId())
                .distinct()
                .count();
        stats.setTotalStudents(uniqueStudents);

        // Attendance stats for teacher's classes
        List<Attendance> allTeacherAttendance = classes.stream()
                .flatMap(c -> attendanceRepository.findByClassId(c.getId()).stream())
                .collect(Collectors.toList());

        long total = allTeacherAttendance.size();
        long present = allTeacherAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long absent = allTeacherAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long late = allTeacherAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();

        stats.setTotalAttendanceRecords(total);
        stats.setPresentCount(present);
        stats.setAbsentCount(absent);
        stats.setLateCount(late);

        double pct = total > 0 ? ((double) (present + late) / total) * 100.0 : 0.0;
        stats.setAttendancePercentage(Math.round(pct * 10.0) / 10.0);

        List<AttendanceRecordResponse> recent = allTeacherAttendance.stream()
                .sorted((a, b) -> b.getAttendanceTime().compareTo(a.getAttendanceTime()))
                .limit(10)
                .map(attendanceService::mapToResponse)
                .collect(Collectors.toList());
        stats.setRecentAttendance(recent);

        return stats;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStudentDashboardStats(Long studentUserId) {
        Student student = studentRepository.findByUser_Id(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + studentUserId));

        DashboardStatsResponse stats = new DashboardStatsResponse();

        List<Enrollment> enrollments = enrollmentRepository.findByStudent_Id(student.getId());
        stats.setTotalClasses(enrollments.size());

        List<ClassResponse> enrolledClasses = enrollments.stream()
                .map(e -> classService.mapToResponse(e.getClassEntity()))
                .collect(Collectors.toList());
        stats.setClasses(enrolledClasses);

        // Find active sessions for enrolled classes
        List<Long> enrolledClassIds = enrollments.stream().map(e -> e.getClassEntity().getId()).toList();
        List<AttendanceSessionResponse> activeForStudent = sessionRepository.findByStatus(SessionStatus.ACTIVE).stream()
                .filter(s -> enrolledClassIds.contains(s.getClassEntity().getId()))
                .map(sessionService::mapToResponse)
                .collect(Collectors.toList());
        stats.setActiveSessions(activeForStudent.size());
        stats.setActiveSessionsList(activeForStudent);

        // Student's personal attendance metrics
        List<Attendance> studentAttendance = attendanceRepository.findByStudent_Id(student.getId());
        long total = studentAttendance.size();
        long present = studentAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long absent = studentAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long late = studentAttendance.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();

        stats.setTotalAttendanceRecords(total);
        stats.setPresentCount(present);
        stats.setAbsentCount(absent);
        stats.setLateCount(late);

        double pct = total > 0 ? ((double) (present + late) / total) * 100.0 : 0.0;
        stats.setAttendancePercentage(Math.round(pct * 10.0) / 10.0);

        List<AttendanceRecordResponse> recent = attendanceRepository.findRecentByStudentId(student.getId()).stream()
                .limit(10)
                .map(attendanceService::mapToResponse)
                .collect(Collectors.toList());
        stats.setRecentAttendance(recent);

        return stats;
    }
}
