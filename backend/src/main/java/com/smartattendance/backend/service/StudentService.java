package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.request.StudentDto;
import com.smartattendance.backend.dto.response.ClassResponse;
import com.smartattendance.backend.dto.response.StudentResponse;
import com.smartattendance.backend.entity.*;
import com.smartattendance.backend.exception.BadRequestException;
import com.smartattendance.backend.exception.ConflictException;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentService {

    public static final int MAX_STUDENT_CAPACITY = 20;

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final PendingStudentRepository pendingStudentRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(StudentRepository studentRepository,
                          UserRepository userRepository,
                          EnrollmentRepository enrollmentRepository,
                          ClassRepository classRepository,
                          PendingStudentRepository pendingStudentRepository,
                          AttendanceRepository attendanceRepository,
                          PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.classRepository = classRepository;
        this.pendingStudentRepository = pendingStudentRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        return mapToResponse(student);
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentByUserId(Long userId) {
        Student student = studentRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user id: " + userId));
        return mapToResponse(student);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCapacityStatus() {
        long current = studentRepository.count();
        long enrolledFaces = studentRepository.countByFaceEnrolledTrue();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("currentCount", current);
        map.put("maxCapacity", MAX_STUDENT_CAPACITY);
        map.put("remainingCapacity", Math.max(0, MAX_STUDENT_CAPACITY - current));
        map.put("enrolledFaceCount", enrolledFaces);
        map.put("unEnrolledFaceCount", Math.max(0, current - enrolledFaces));
        map.put("isFull", current >= MAX_STUDENT_CAPACITY);
        return map;
    }

    @Transactional
    public StudentResponse createStudent(StudentDto dto) {
        long currentCount = studentRepository.count();
        if (currentCount >= MAX_STUDENT_CAPACITY) {
            throw new BadRequestException("Maximum prototype capacity reached. You cannot add more than 20 students.");
        }

        if (studentRepository.existsByStudentNumber(dto.getStudentNumber())) {
            throw new ConflictException("Student roll/ID already exists: " + dto.getStudentNumber());
        }
        if (studentRepository.existsByEmail(dto.getEmail())) {
            throw new ConflictException("Email already registered: " + dto.getEmail());
        }

        User user;
        if (dto.getUserId() != null) {
            user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));
        } else {
            String username = dto.getStudentNumber().toLowerCase().replaceAll("[^a-z0-9]", "");
            if (userRepository.existsByUsername(username)) {
                username = username + "_" + (System.currentTimeMillis() % 1000);
            }
            user = new User(username, dto.getEmail(), passwordEncoder.encode("Student@123"), Role.STUDENT);
            user = userRepository.save(user);
        }

        Student student = new Student(
                user,
                dto.getStudentNumber(),
                dto.getFirstName(),
                dto.getLastName(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getDepartment(),
                dto.getYear() != null ? dto.getYear() : 1,
                dto.getSection() != null ? dto.getSection() : "A"
        );
        student.setDob(dto.getDob());
        student.setGender(dto.getGender());
        student.setPhoto(dto.getPhoto());
        student.setCourse(dto.getCourse());
        student.setSemester(dto.getSemester() != null ? dto.getSemester() : 1);
        student.setAcademicYear(dto.getAcademicYear() != null && !dto.getAcademicYear().trim().isEmpty() ? dto.getAcademicYear() : "2025-2026");
        student.setParentName(dto.getParentName());
        student.setParentPhone(dto.getParentPhone());
        student.setParentEmail(dto.getParentEmail());
        if (dto.getFaceEmbedding() != null && !dto.getFaceEmbedding().trim().isEmpty()) {
            student.setFaceEmbedding(dto.getFaceEmbedding().trim());
            student.setFaceEnrolled(true);
        }

        student = studentRepository.save(student);

        // Auto-enroll student into all master classes so sessions immediately include them
        List<ClassEntity> allClasses = classRepository.findAll();
        for (ClassEntity cls : allClasses) {
            if (!enrollmentRepository.existsByStudent_IdAndClassEntity_Id(student.getId(), cls.getId())) {
                enrollmentRepository.save(new Enrollment(student, cls));
            }
        }

        return mapToResponse(student);
    }

    @Transactional
    public StudentResponse updateStudent(Long id, StudentDto dto) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        if (!student.getStudentNumber().equalsIgnoreCase(dto.getStudentNumber()) &&
                studentRepository.existsByStudentNumber(dto.getStudentNumber())) {
            throw new ConflictException("Student number already exists: " + dto.getStudentNumber());
        }

        student.setStudentNumber(dto.getStudentNumber());
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setEmail(dto.getEmail());
        student.setPhone(dto.getPhone());
        student.setDepartment(dto.getDepartment());
        if (dto.getYear() != null) {
            student.setYear(dto.getYear());
        }
        if (dto.getSection() != null) {
            student.setSection(dto.getSection());
        }
        if (dto.getDob() != null) student.setDob(dto.getDob());
        if (dto.getGender() != null) student.setGender(dto.getGender());
        if (dto.getPhoto() != null) student.setPhoto(dto.getPhoto());
        if (dto.getCourse() != null) student.setCourse(dto.getCourse());
        if (dto.getSemester() != null) student.setSemester(dto.getSemester());
        if (dto.getAcademicYear() != null) student.setAcademicYear(dto.getAcademicYear());
        if (dto.getParentName() != null) student.setParentName(dto.getParentName());
        if (dto.getParentPhone() != null) student.setParentPhone(dto.getParentPhone());
        if (dto.getParentEmail() != null) student.setParentEmail(dto.getParentEmail());
        if (dto.getFaceEmbedding() != null && !dto.getFaceEmbedding().trim().isEmpty()) {
            student.setFaceEmbedding(dto.getFaceEmbedding().trim());
            student.setFaceEnrolled(true);
        }

        student = studentRepository.save(student);
        return mapToResponse(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        // Delete associated attendances
        List<Attendance> attendances = attendanceRepository.findByStudent_Id(id);
        if (!attendances.isEmpty()) {
            attendanceRepository.deleteAll(attendances);
        }

        // Delete associated enrollments
        List<Enrollment> enrollments = enrollmentRepository.findByStudent_Id(id);
        if (!enrollments.isEmpty()) {
            enrollmentRepository.deleteAll(enrollments);
        }

        Long userId = student.getUser() != null ? student.getUser().getId() : null;
        studentRepository.delete(student);

        if (userId != null) {
            userRepository.deleteById(userId);
        }
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
    public PendingStudent submitRegistrationRequest(String email, String fullName, String department, String phone) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        String trimmedEmail = email.trim().toLowerCase();
        if (studentRepository.existsByEmail(trimmedEmail)) {
            throw new ConflictException("Student with this email is already registered and active.");
        }
        if (pendingStudentRepository.existsByEmailIgnoreCase(trimmedEmail)) {
            PendingStudent existing = pendingStudentRepository.findByEmailIgnoreCase(trimmedEmail).get();
            if ("PENDING".equalsIgnoreCase(existing.getStatus())) {
                throw new ConflictException("A registration request for this email is already pending HOD approval.");
            }
        }
        PendingStudent ps = new PendingStudent(trimmedEmail, fullName, department, phone);
        return pendingStudentRepository.save(ps);
    }

    @Transactional(readOnly = true)
    public List<PendingStudent> getPendingStudents() {
        return pendingStudentRepository.findAll();
    }

    @Transactional
    public StudentResponse approvePendingStudent(Long pendingId) {
        PendingStudent ps = pendingStudentRepository.findById(pendingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pending student request not found with id: " + pendingId));
        if (studentRepository.count() >= MAX_STUDENT_CAPACITY) {
            throw new BadRequestException("Maximum prototype capacity reached (20 students). Cannot approve more students.");
        }

        long nextRollNum = studentRepository.count() + 1;
        String rollNo = String.format("STU%03d", nextRollNum);
        while (studentRepository.existsByStudentNumber(rollNo)) {
            nextRollNum++;
            rollNo = String.format("STU%03d", nextRollNum);
        }

        StudentDto dto = new StudentDto();
        dto.setEmail(ps.getEmail());
        String name = ps.getFullName() != null && !ps.getFullName().trim().isEmpty() ? ps.getFullName().trim() : "Student " + nextRollNum;
        String[] parts = name.split(" ", 2);
        dto.setFirstName(parts[0]);
        dto.setLastName(parts.length > 1 ? parts[1] : "Student");
        dto.setStudentNumber(rollNo);
        dto.setDepartment(ps.getDepartment() != null ? ps.getDepartment() : "Computer Science");
        dto.setPhone(ps.getPhone() != null ? ps.getPhone() : "9876543210");
        dto.setYear(1);
        dto.setSection("A");

        StudentResponse created = createStudent(dto);
        ps.setStatus("APPROVED");
        ps.setProcessedAt(LocalDateTime.now());
        pendingStudentRepository.save(ps);
        return created;
    }

    @Transactional
    public PendingStudent rejectPendingStudent(Long pendingId) {
        PendingStudent ps = pendingStudentRepository.findById(pendingId)
                .orElseThrow(() -> new ResourceNotFoundException("Pending student request not found with id: " + pendingId));
        ps.setStatus("REJECTED");
        ps.setProcessedAt(LocalDateTime.now());
        return pendingStudentRepository.save(ps);
    }

    @Transactional(readOnly = true)
    public List<ClassResponse> getEnrolledClasses(Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudent_Id(studentId);
        return enrollments.stream().map(e -> {
            ClassEntity c = e.getClassEntity();
            ClassResponse cr = new ClassResponse();
            cr.setId(c.getId());
            cr.setClassName(c.getClassName());
            cr.setRoom(c.getRoom());
            cr.setScheduleDay(c.getScheduleDay());
            cr.setStartTime(c.getStartTime());
            cr.setEndTime(c.getEndTime());
            cr.setCreatedAt(c.getCreatedAt());
            if (c.getCourse() != null) {
                cr.setCourseId(c.getCourse().getId());
                cr.setCourseCode(c.getCourse().getCourseCode());
                cr.setCourseName(c.getCourse().getCourseName());
            }
            if (c.getTeacher() != null) {
                cr.setTeacherId(c.getTeacher().getId());
                cr.setTeacherName(c.getTeacher().getFirstName() + " " + c.getTeacher().getLastName());
            }
            return cr;
        }).collect(Collectors.toList());
    }

    public StudentResponse mapToResponse(Student s) {
        StudentResponse r = new StudentResponse();
        r.setId(s.getId());
        r.setUserId(s.getUser() != null ? s.getUser().getId() : null);
        r.setStudentNumber(s.getStudentNumber());
        r.setFirstName(s.getFirstName());
        r.setLastName(s.getLastName());
        r.setEmail(s.getEmail());
        r.setPhone(s.getPhone());
        r.setDepartment(s.getDepartment());
        r.setYear(s.getYear());
        r.setSection(s.getSection());
        r.setDob(s.getDob());
        r.setGender(s.getGender());
        r.setPhoto(s.getPhoto());
        r.setCourse(s.getCourse());
        r.setSemester(s.getSemester());
        r.setAcademicYear(s.getAcademicYear());
        r.setParentName(s.getParentName());
        r.setParentPhone(s.getParentPhone());
        r.setParentEmail(s.getParentEmail());
        r.setFaceEnrolled(s.isFaceEnrolled());
        r.setFaceStatus(s.isFaceEnrolled() ? "FACE ENROLLED" : "FACE NOT ENROLLED");
        r.setAccountStatus("ACTIVE");
        r.setCreatedAt(s.getCreatedAt());

        long total = attendanceRepository.countByStudent_Id(s.getId());
        long present = attendanceRepository.countByStudent_IdAndStatus(s.getId(), AttendanceStatus.PRESENT);
        double pct = total > 0 ? Math.round((present * 100.0 / total) * 10.0) / 10.0 : 0.0;
        r.setAttendancePercentage(pct);
        return r;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentActivity(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        StudentResponse profile = mapToResponse(student);
        List<Attendance> records = attendanceRepository.findRecentByStudentId(id);

        long total = attendanceRepository.countByStudent_Id(id);
        long present = attendanceRepository.countByStudent_IdAndStatus(id, AttendanceStatus.PRESENT);
        long absent = attendanceRepository.countByStudent_IdAndStatus(id, AttendanceStatus.ABSENT);
        long late = attendanceRepository.countByStudent_IdAndStatus(id, AttendanceStatus.LATE);
        double pct = total > 0 ? Math.round((present * 100.0 / total) * 10.0) / 10.0 : 0.0;

        Map<String, Object> activity = new LinkedHashMap<>();
        activity.put("student", profile);
        activity.put("totalSessions", total);
        activity.put("presentCount", present);
        activity.put("absentCount", absent);
        activity.put("lateCount", late);
        activity.put("attendancePercentage", pct);
        activity.put("records", records.stream().map(a -> {
            Map<String, Object> rec = new LinkedHashMap<>();
            rec.put("id", a.getId());
            rec.put("sessionId", a.getSession() != null ? a.getSession().getId() : null);
            rec.put("className", a.getSession() != null && a.getSession().getClassEntity() != null ? a.getSession().getClassEntity().getClassName() : "General Class");
            rec.put("date", a.getSession() != null ? a.getSession().getSessionDate() : null);
            rec.put("time", a.getAttendanceTime());
            rec.put("status", a.getStatus() != null ? a.getStatus().name() : "PRESENT");
            rec.put("locationStatus", a.getLocationStatus());
            rec.put("faceStatus", a.getFaceStatus());
            rec.put("distanceFromClass", a.getDistanceFromClass());
            rec.put("teacherVerification", a.getTeacherVerification());
            rec.put("remarks", a.getRemarks());
            return rec;
        }).collect(Collectors.toList()));
        return activity;
    }
}
