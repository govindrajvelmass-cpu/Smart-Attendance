package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.request.AttendanceSessionRequest;
import com.smartattendance.backend.dto.response.AttendanceSessionResponse;
import com.smartattendance.backend.entity.*;
import com.smartattendance.backend.exception.BadRequestException;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.*;
import com.smartattendance.backend.util.GeoUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceSessionService {

    private final AttendanceSessionRepository sessionRepository;
    private final ClassRepository classRepository;
    private final TeacherRepository teacherRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmailService emailService;

    public AttendanceSessionService(AttendanceSessionRepository sessionRepository,
                                    ClassRepository classRepository,
                                    TeacherRepository teacherRepository,
                                    EnrollmentRepository enrollmentRepository,
                                    AttendanceRepository attendanceRepository,
                                    EmailService emailService) {
        this.sessionRepository = sessionRepository;
        this.classRepository = classRepository;
        this.teacherRepository = teacherRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<AttendanceSessionResponse> getAllSessions() {
        return sessionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AttendanceSessionResponse getSessionById(Long id) {
        AttendanceSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + id));
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public List<AttendanceSessionResponse> getActiveSessions() {
        return sessionRepository.findByStatusOrderByIdDesc(SessionStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceSessionResponse> getSessionsByClass(Long classId) {
        return sessionRepository.findByClassEntity_Id(classId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceSessionResponse> getSessionsByTeacher(Long teacherId) {
        return sessionRepository.findByTeacher_Id(teacherId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceSessionResponse createSession(AttendanceSessionRequest request, Long teacherUserId) {
        ClassEntity classEntity = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + request.getClassId()));

        Teacher teacher;
        if (teacherUserId != null) {
            teacher = teacherRepository.findByUser_Id(teacherUserId)
                    .orElse(classEntity.getTeacher());
        } else {
            teacher = classEntity.getTeacher();
        }

        SessionStatus initialStatus = SessionStatus.DRAFT;
        if (request.getLatitude() != null && request.getLongitude() != null) {
            if (!GeoUtils.isValidCoordinate(request.getLatitude(), request.getLongitude())) {
                throw new BadRequestException("Invalid latitude (-90 to 90) or longitude (-180 to 180) values");
            }
            initialStatus = SessionStatus.ACTIVE;
        }

        double radius = (request.getAllowedRadius() != null && request.getAllowedRadius() > 0) ? request.getAllowedRadius() : 50.0;

        AttendanceSession session = new AttendanceSession(
                classEntity,
                teacher,
                request.getSessionDate() != null ? request.getSessionDate() : LocalDate.now(),
                request.getStartTime() != null ? request.getStartTime() : LocalTime.now(),
                request.getEndTime(),
                request.getLatitude(),
                request.getLongitude(),
                radius,
                initialStatus
        );

        session = sessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional
    public AttendanceSessionResponse startSession(Long id) {
        AttendanceSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + id));

        if (session.getLatitude() == null || session.getLongitude() == null) {
            throw new BadRequestException("Cannot activate session without setting classroom geofence location.");
        }

        session.setStatus(SessionStatus.ACTIVE);
        if (session.getStartTime() == null) {
            session.setStartTime(LocalTime.now());
        }
        session = sessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional
    public AttendanceSessionResponse stopSession(Long id) {
        AttendanceSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + id));

        session.setStatus(SessionStatus.CLOSED);
        session.setEndTime(LocalTime.now());
        session = sessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional
    public AttendanceSessionResponse updateSessionLocation(Long id, Double latitude, Double longitude, Double radius) {
        AttendanceSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + id));

        if (!GeoUtils.isValidCoordinate(latitude, longitude)) {
            throw new BadRequestException("Invalid latitude or longitude coordinates");
        }

        if (radius == null || radius <= 0) {
            throw new BadRequestException("Allowed radius must be greater than zero");
        }

        session.setLatitude(latitude);
        session.setLongitude(longitude);
        session.setAllowedRadius(radius);
        if (session.getStatus() == SessionStatus.DRAFT) {
            session.setStatus(SessionStatus.LOCATION_SET);
        }
        session = sessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public java.util.List<java.util.Map<String, Object>> getSessionRecipients(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + sessionId));
        java.util.List<Enrollment> enrollments = enrollmentRepository.findByClassEntity_Id(session.getClassEntity().getId());
        return enrollments.stream().map(e -> {
            Student s = e.getStudent();
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("studentId", s.getId());
            map.put("rollNumber", s.getStudentNumber());
            map.put("name", s.getFirstName() + " " + s.getLastName());
            map.put("email", s.getEmail());
            map.put("department", s.getDepartment());
            map.put("faceEnrolled", s.isFaceEnrolled());
            map.put("faceStatus", s.isFaceEnrolled() ? "FACE ENROLLED" : "FACE NOT ENROLLED");
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public java.util.Map<String, Object> sendAttendanceEmails(Long id) {
        AttendanceSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + id));

        java.util.Map<String, Object> result = emailService.sendSessionNotificationEmails(session);
        session.setEmailStatus((String) result.get("smtpStatus"));
        sessionRepository.save(session);
        return result;
    }

    @Transactional
    public void deleteSession(Long id) {
        AttendanceSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + id));
        List<Attendance> records = attendanceRepository.findBySession_Id(id);
        if (!records.isEmpty()) {
            attendanceRepository.deleteAll(records);
        }
        sessionRepository.delete(session);
    }

    public AttendanceSessionResponse mapToResponse(AttendanceSession s) {
        AttendanceSessionResponse r = new AttendanceSessionResponse();
        r.setId(s.getId());
        if (s.getClassEntity() != null) {
            r.setClassId(s.getClassEntity().getId());
            r.setClassName(s.getClassEntity().getClassName());
            if (s.getClassEntity().getCourse() != null) {
                r.setCourseCode(s.getClassEntity().getCourse().getCourseCode());
                r.setCourseName(s.getClassEntity().getCourse().getCourseName());
            }
        }
        if (s.getTeacher() != null) {
            r.setTeacherId(s.getTeacher().getId());
            r.setTeacherName(s.getTeacher().getFirstName() + " " + s.getTeacher().getLastName());
        }
        r.setSessionDate(s.getSessionDate());
        r.setStartTime(s.getStartTime());
        r.setEndTime(s.getEndTime());
        r.setLatitude(s.getLatitude());
        r.setLongitude(s.getLongitude());
        r.setAllowedRadius(s.getAllowedRadius());
        r.setStatus(s.getStatus());
        r.setEmailStatus(s.getEmailStatus() != null ? s.getEmailStatus() : "NOT_SENT");
        r.setCreatedAt(s.getCreatedAt());

        if (s.getClassEntity() != null) {
            int total = enrollmentRepository.findByClassEntity_Id(s.getClassEntity().getId()).size();
            r.setTotalEnrolled(total);
        }

        r.setPresentCount(attendanceRepository.countBySession_IdAndStatus(s.getId(), AttendanceStatus.PRESENT));
        r.setAbsentCount(attendanceRepository.countBySession_IdAndStatus(s.getId(), AttendanceStatus.ABSENT));
        r.setLateCount(attendanceRepository.countBySession_IdAndStatus(s.getId(), AttendanceStatus.LATE));

        return r;
    }
}
