package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.request.MarkAttendanceRequest;
import com.smartattendance.backend.dto.request.UpdateAttendanceRequest;
import com.smartattendance.backend.dto.response.AttendanceRecordResponse;
import com.smartattendance.backend.entity.*;
import com.smartattendance.backend.exception.BadRequestException;
import com.smartattendance.backend.exception.ConflictException;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.AttendanceRepository;
import com.smartattendance.backend.repository.AttendanceSessionRepository;
import com.smartattendance.backend.repository.EnrollmentRepository;
import com.smartattendance.backend.repository.StudentRepository;
import com.smartattendance.backend.security.JwtTokenProvider;
import com.smartattendance.backend.util.GeoUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.attendance.late-threshold-minutes:10}")
    private int lateThresholdMinutes;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             AttendanceSessionRepository sessionRepository,
                             StudentRepository studentRepository,
                             EnrollmentRepository enrollmentRepository,
                             JwtTokenProvider jwtTokenProvider) {
        this.attendanceRepository = attendanceRepository;
        this.sessionRepository = sessionRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> verifyAttendanceToken(String token) {
        try {
            io.jsonwebtoken.Claims claims = jwtTokenProvider.parseAttendanceToken(token);
            Long studentId = claims.get("studentId", Long.class);
            Long sessionId = claims.get("sessionId", Long.class);

            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for token"));
            AttendanceSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found for token"));

            boolean alreadyMarked = attendanceRepository.existsBySession_IdAndStudent_Id(sessionId, studentId);
            AttendanceRecordResponse existingRecord = null;
            if (alreadyMarked) {
                Attendance att = attendanceRepository.findBySession_IdAndStudent_Id(sessionId, studentId).orElse(null);
                if (att != null) {
                    existingRecord = mapToResponse(att);
                }
            }

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("valid", true);
            res.put("token", token);
            res.put("studentId", student.getId());
            res.put("studentName", student.getFirstName() + " " + student.getLastName());
            res.put("rollNumber", student.getStudentNumber());
            res.put("email", student.getEmail());
            res.put("sessionId", session.getId());
            res.put("courseName", session.getClassEntity().getCourse().getCourseName());
            res.put("className", session.getClassEntity().getClassName());
            res.put("teacherName", session.getTeacher().getFirstName() + " " + session.getTeacher().getLastName());
            res.put("sessionDate", String.valueOf(session.getSessionDate()));
            res.put("startTime", String.valueOf(session.getStartTime()));
            res.put("endTime", String.valueOf(session.getEndTime()));
            res.put("classroom", session.getClassEntity().getRoom());
            res.put("latitude", session.getLatitude());
            res.put("longitude", session.getLongitude());
            res.put("allowedRadius", session.getAllowedRadius());
            res.put("sessionStatus", session.getStatus() == SessionStatus.ACTIVE ? "SESSION ACTIVE" : "SESSION CLOSED");
            res.put("alreadyMarked", alreadyMarked);
            res.put("existingRecord", existingRecord);
            return res;
        } catch (Exception e) {
            throw new BadRequestException("Attendance invitation token is invalid or expired: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> verifyLocation(Long sessionId, Double studentLat, Double studentLon) {
        if (!GeoUtils.isValidCoordinate(studentLat, studentLon)) {
            throw new BadRequestException("Invalid latitude (-90 to 90) or longitude (-180 to 180)");
        }
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        double distance = GeoUtils.calculateDistanceMeters(
                studentLat, studentLon,
                session.getLatitude(), session.getLongitude()
        );
        double radius = (session.getAllowedRadius() != null && session.getAllowedRadius() > 0) ? session.getAllowedRadius() : 50.0;
        boolean verified = distance <= radius;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("verified", verified);
        res.put("distance", distance);
        res.put("allowedRadius", radius);
        res.put("status", verified ? "Location Verified ✓" : "Location Verification Failed");
        res.put("message", verified
                ? String.format(Locale.US, "Location Verified ✓ (%.1fm from classroom)", distance)
                : String.format(Locale.US, "Attendance cannot be marked because you are outside the classroom location (%.1fm away, max: %.0fm).", distance, radius));
        return res;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> verifyFace(Long studentId, String liveEmbedding) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (!student.isFaceEnrolled() || student.getFaceEmbedding() == null) {
            throw new BadRequestException("Student has no HOD-enrolled face biometric profile on record.");
        }

        boolean verified = com.smartattendance.backend.util.FaceUtils.compareEmbeddings(student.getFaceEmbedding(), liveEmbedding);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("verified", verified);
        res.put("faceEnrolled", true);
        res.put("status", verified ? "Face Verified ✓" : "Face Verification Failed");
        res.put("message", verified
                ? "Face Verified ✓ Live face matches HOD-enrolled biometric profile."
                : "Face verification failed. Attendance was not recorded.");
        return res;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentTodayAttendance(Long currentUserId) {
        Student student = studentRepository.findByUser_Id(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + currentUserId));

        LocalDate today = LocalDate.now();
        List<AttendanceSession> sessionsToday = sessionRepository.findBySessionDateOrderByIdDesc(today);
        List<Attendance> attendances = attendanceRepository.findByStudent_Id(student.getId());

        Map<Long, Attendance> attendanceBySession = new HashMap<>();
        for (Attendance a : attendances) {
            if (a.getSession() != null) {
                attendanceBySession.put(a.getSession().getId(), a);
            }
        }

        List<Map<String, Object>> todayItems = new ArrayList<>();
        for (AttendanceSession s : sessionsToday) {
            boolean enrolled = enrollmentRepository.existsByStudent_IdAndClassEntity_Id(student.getId(), s.getClassEntity().getId());
            if (!enrolled) continue;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("sessionId", s.getId());
            item.put("subject", s.getClassEntity().getCourse().getCourseName());
            item.put("courseCode", s.getClassEntity().getCourse().getCourseCode());
            item.put("teacher", s.getTeacher().getFirstName() + " " + s.getTeacher().getLastName());
            item.put("sessionDate", String.valueOf(s.getSessionDate()));
            item.put("startTime", String.valueOf(s.getStartTime()));
            item.put("endTime", String.valueOf(s.getEndTime()));
            item.put("sessionStatus", s.getStatus().name());

            Attendance att = attendanceBySession.get(s.getId());
            if (att != null) {
                item.put("attendanceStatus", att.getStatus().name());
                item.put("locationVerification", att.getLocationStatus());
                item.put("faceVerification", att.getFaceStatus());
                item.put("attendanceTime", String.valueOf(att.getAttendanceTime()));
                item.put("marked", true);
            } else {
                item.put("attendanceStatus", "NOT MARKED");
                item.put("locationVerification", "NOT ATTEMPTED");
                item.put("faceVerification", "NOT ATTEMPTED");
                item.put("attendanceTime", null);
                item.put("marked", false);
            }
            todayItems.add(item);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("studentId", student.getId());
        response.put("studentName", student.getFirstName() + " " + student.getLastName());
        response.put("rollNumber", student.getStudentNumber());
        response.put("date", String.valueOf(today));
        response.put("todaySessions", todayItems);
        return response;
    }

    @Transactional
    public AttendanceRecordResponse markAttendance(MarkAttendanceRequest request, Long studentUserId) {
        if (!GeoUtils.isValidCoordinate(request.getLatitude(), request.getLongitude())) {
            throw new BadRequestException("Invalid latitude (-90 to 90) or longitude (-180 to 180)");
        }

        AttendanceSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + request.getSessionId()));

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BadRequestException("Attendance session is closed or inactive");
        }

        Student student;
        if (request.getToken() != null && !request.getToken().trim().isEmpty()) {
            io.jsonwebtoken.Claims claims = jwtTokenProvider.parseAttendanceToken(request.getToken());
            Long sId = claims.get("studentId", Long.class);
            student = studentRepository.findById(sId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for attendance token"));
        } else if (studentUserId != null) {
            student = studentRepository.findByUser_Id(studentUserId)
                    .orElse(null);
            if (student == null) {
                student = studentRepository.findById(studentUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
            }
        } else {
            throw new BadRequestException("Student authentication or attendance token required");
        }

        // Check class enrollment
        boolean isEnrolled = enrollmentRepository.existsByStudent_IdAndClassEntity_Id(
                student.getId(), session.getClassEntity().getId()
        );
        if (!isEnrolled) {
            throw new BadRequestException("You are not enrolled in this class (" + session.getClassEntity().getClassName() + ")");
        }

        // Duplicate attendance check
        if (attendanceRepository.existsBySession_IdAndStudent_Id(session.getId(), student.getId())) {
            throw new ConflictException("Attendance already marked for this session");
        }

        // 1. Location check using Haversine formula on the backend
        double distance = GeoUtils.calculateDistanceMeters(
                request.getLatitude(), request.getLongitude(),
                session.getLatitude(), session.getLongitude()
        );
        boolean locationPass = distance <= session.getAllowedRadius();
        if (!locationPass) {
            throw new BadRequestException(String.format(Locale.US,
                    "Attendance cannot be marked because you are outside the classroom location (%.1fm away, allowed radius: %.0fm)",
                    distance, session.getAllowedRadius()));
        }
        String locationStatus = "VERIFIED";

        // 2. Face verification check
        boolean facePass = false;
        if (student.getFaceEmbedding() != null && request.getFaceEmbedding() != null) {
            facePass = com.smartattendance.backend.util.FaceUtils.compareEmbeddings(student.getFaceEmbedding(), request.getFaceEmbedding());
        } else if (Boolean.TRUE.equals(request.getFaceVerified()) && student.isFaceEnrolled()) {
            facePass = true;
        }
        String faceStatus = facePass ? "VERIFIED" : "FAILED";

        // 3. Evaluation of two-factor verification
        AttendanceStatus status;
        String teacherVerification;
        String remarks;

        if (locationPass && facePass) {
            status = AttendanceStatus.PRESENT;
            teacherVerification = "VERIFIED";
            remarks = String.format("Verified at %.1fm from classroom", distance);

            if (session.getStartTime() != null) {
                LocalTime now = LocalTime.now();
                long minutesSinceStart = Duration.between(session.getStartTime(), now).toMinutes();
                if (minutesSinceStart > lateThresholdMinutes) {
                    status = AttendanceStatus.LATE;
                    remarks = String.format("Late by %d mins (allowed %d mins). Verified at %.1fm",
                            minutesSinceStart, lateThresholdMinutes, distance);
                }
            }
        } else {
            status = AttendanceStatus.REJECTED;
            teacherVerification = "REJECTED";
            remarks = "Face verification failed. Live face does not match student profile.";
        }

        Attendance attendance = new Attendance();
        attendance.setSession(session);
        attendance.setStudent(student);
        attendance.setAttendanceTime(LocalDateTime.now());
        attendance.setLatitude(request.getLatitude());
        attendance.setLongitude(request.getLongitude());
        attendance.setDistanceFromClass(distance);
        attendance.setClassLatitude(session.getLatitude());
        attendance.setClassLongitude(session.getLongitude());
        attendance.setAllowedRadius(session.getAllowedRadius());
        attendance.setLocationStatus(locationStatus);
        attendance.setFaceStatus(faceStatus);
        attendance.setTeacherVerification(teacherVerification);
        attendance.setStatus(status);
        attendance.setRemarks(remarks);

        attendance = attendanceRepository.save(attendance);
        return mapToResponse(attendance);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getAttendanceByStudent(Long studentId) {
        return attendanceRepository.findByStudent_Id(studentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getAttendanceByClass(Long classId) {
        return attendanceRepository.findByClassId(classId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getAttendanceBySession(Long sessionId) {
        return attendanceRepository.findBySession_Id(sessionId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceRecordResponse updateAttendance(Long id, UpdateAttendanceRequest request) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id));

        attendance.setStatus(request.getStatus());
        if (request.getRemarks() != null) {
            attendance.setRemarks(request.getRemarks());
        }

        attendance = attendanceRepository.save(attendance);
        return mapToResponse(attendance);
    }

    @Transactional
    public AttendanceRecordResponse verifyAttendance(Long id, String verificationStatus) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id));

        attendance.setTeacherVerification(verificationStatus);
        if ("VERIFIED".equalsIgnoreCase(verificationStatus)) {
            attendance.setStatus(AttendanceStatus.PRESENT);
        } else if ("REJECTED".equalsIgnoreCase(verificationStatus)) {
            attendance.setStatus(AttendanceStatus.REJECTED);
        }

        attendance = attendanceRepository.save(attendance);
        return mapToResponse(attendance);
    }

    @Transactional
    public void enrollStudentFace(Long studentId, String faceEmbedding) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        student.setFaceEmbedding(faceEmbedding);
        student.setFaceEnrolled(true);
        studentRepository.save(student);
    }

    @Transactional
    public void deleteAttendance(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id));
        attendanceRepository.delete(attendance);
    }

    public AttendanceRecordResponse mapToResponse(Attendance a) {
        AttendanceRecordResponse r = new AttendanceRecordResponse();
        r.setId(a.getId());
        if (a.getSession() != null) {
            r.setSessionId(a.getSession().getId());
            r.setSessionDate(a.getSession().getSessionDate());
            if (a.getSession().getClassEntity() != null) {
                r.setClassName(a.getSession().getClassEntity().getClassName());
                if (a.getSession().getClassEntity().getCourse() != null) {
                    r.setCourseCode(a.getSession().getClassEntity().getCourse().getCourseCode());
                }
            }
        }
        if (a.getStudent() != null) {
            r.setStudentId(a.getStudent().getId());
            r.setStudentNumber(a.getStudent().getStudentNumber());
            r.setStudentName(a.getStudent().getFirstName() + " " + a.getStudent().getLastName());
            r.setStudentEmail(a.getStudent().getEmail());
            r.setDepartment(a.getStudent().getDepartment());
            r.setYear(a.getStudent().getYear());
            r.setSemester(a.getStudent().getSemester());
        }
        r.setAttendanceTime(a.getAttendanceTime());
        r.setLatitude(a.getLatitude());
        r.setLongitude(a.getLongitude());
        r.setDistanceFromClass(a.getDistanceFromClass());
        r.setClassLatitude(a.getClassLatitude());
        r.setClassLongitude(a.getClassLongitude());
        r.setAllowedRadius(a.getAllowedRadius());
        r.setLocationStatus(a.getLocationStatus());
        r.setFaceStatus(a.getFaceStatus());
        r.setTeacherVerification(a.getTeacherVerification());
        r.setStatus(a.getStatus());
        r.setRemarks(a.getRemarks());
        return r;
    }
}
