package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.request.TeacherDto;
import com.smartattendance.backend.dto.response.ClassResponse;
import com.smartattendance.backend.dto.response.TeacherResponse;
import com.smartattendance.backend.entity.ClassEntity;
import com.smartattendance.backend.entity.Role;
import com.smartattendance.backend.entity.Teacher;
import com.smartattendance.backend.entity.User;
import com.smartattendance.backend.exception.BadRequestException;
import com.smartattendance.backend.exception.ConflictException;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.ClassRepository;
import com.smartattendance.backend.repository.EnrollmentRepository;
import com.smartattendance.backend.repository.TeacherRepository;
import com.smartattendance.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;

    public TeacherService(TeacherRepository teacherRepository,
                          UserRepository userRepository,
                          ClassRepository classRepository,
                          EnrollmentRepository enrollmentRepository,
                          PasswordEncoder passwordEncoder) {
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<TeacherResponse> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeacherResponse getTeacherById(Long id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + id));
        return mapToResponse(teacher);
    }

    @Transactional(readOnly = true)
    public TeacherResponse getTeacherByUserId(Long userId) {
        Teacher teacher = teacherRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found for user id: " + userId));
        return mapToResponse(teacher);
    }

    @Transactional
    public TeacherResponse createTeacher(TeacherDto dto) {
        if (teacherRepository.existsByEmployeeNumber(dto.getEmployeeNumber())) {
            throw new ConflictException("Employee number already exists: " + dto.getEmployeeNumber());
        }
        if (teacherRepository.existsByEmail(dto.getEmail())) {
            throw new ConflictException("Email already registered: " + dto.getEmail());
        }

        User user;
        if (dto.getUserId() != null) {
            user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));
        } else {
            String username = dto.getEmployeeNumber().toLowerCase().replaceAll("[^a-z0-9]", "");
            if (userRepository.existsByUsername(username)) {
                username = username + "_" + System.currentTimeMillis() % 1000;
            }
            user = new User(username, dto.getEmail(), passwordEncoder.encode("Teacher@123"), Role.TEACHER);
            user = userRepository.save(user);
        }

        Teacher teacher = new Teacher(
                user,
                dto.getEmployeeNumber(),
                dto.getFirstName(),
                dto.getLastName(),
                dto.getEmail(),
                dto.getDepartment()
        );

        teacher = teacherRepository.save(teacher);
        return mapToResponse(teacher);
    }

    @Transactional
    public TeacherResponse updateTeacher(Long id, TeacherDto dto) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + id));

        if (!teacher.getEmployeeNumber().equalsIgnoreCase(dto.getEmployeeNumber()) &&
                teacherRepository.existsByEmployeeNumber(dto.getEmployeeNumber())) {
            throw new ConflictException("Employee number already exists: " + dto.getEmployeeNumber());
        }

        teacher.setEmployeeNumber(dto.getEmployeeNumber());
        teacher.setFirstName(dto.getFirstName());
        teacher.setLastName(dto.getLastName());
        teacher.setEmail(dto.getEmail());
        teacher.setDepartment(dto.getDepartment());

        teacher = teacherRepository.save(teacher);
        return mapToResponse(teacher);
    }

    @Transactional
    public void deleteTeacher(Long id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + id));

        Long userId = teacher.getUser() != null ? teacher.getUser().getId() : null;
        teacherRepository.delete(teacher);

        if (userId != null) {
            userRepository.deleteById(userId);
        }
    }

    @Transactional(readOnly = true)
    public List<ClassResponse> getAssignedClasses(Long teacherId) {
        List<ClassEntity> classes = classRepository.findByTeacher_Id(teacherId);
        return classes.stream().map(c -> {
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
            cr.setEnrolledCount(enrollmentRepository.findByClassEntity_Id(c.getId()).size());
            return cr;
        }).collect(Collectors.toList());
    }

    public TeacherResponse mapToResponse(Teacher t) {
        TeacherResponse r = new TeacherResponse();
        r.setId(t.getId());
        r.setUserId(t.getUser() != null ? t.getUser().getId() : null);
        r.setEmployeeNumber(t.getEmployeeNumber());
        r.setFirstName(t.getFirstName());
        r.setLastName(t.getLastName());
        r.setEmail(t.getEmail());
        r.setDepartment(t.getDepartment());
        r.setCreatedAt(t.getCreatedAt());
        return r;
    }
}
