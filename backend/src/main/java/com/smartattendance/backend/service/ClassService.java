package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.request.ClassDto;
import com.smartattendance.backend.dto.response.ClassResponse;
import com.smartattendance.backend.dto.response.StudentResponse;
import com.smartattendance.backend.entity.*;
import com.smartattendance.backend.exception.ConflictException;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClassService {

    private final ClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentService studentService;

    public ClassService(ClassRepository classRepository,
                        CourseRepository courseRepository,
                        TeacherRepository teacherRepository,
                        StudentRepository studentRepository,
                        EnrollmentRepository enrollmentRepository,
                        StudentService studentService) {
        this.classRepository = classRepository;
        this.courseRepository = courseRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentService = studentService;
    }

    @Transactional(readOnly = true)
    public List<ClassResponse> getAllClasses() {
        return classRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClassResponse getClassById(Long id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        return mapToResponse(classEntity);
    }

    @Transactional
    public ClassResponse createClass(ClassDto dto) {
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + dto.getCourseId()));

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + dto.getTeacherId()));

        ClassEntity classEntity = new ClassEntity(
                course,
                teacher,
                dto.getClassName(),
                dto.getRoom(),
                dto.getScheduleDay(),
                dto.getStartTime(),
                dto.getEndTime()
        );

        classEntity = classRepository.save(classEntity);
        return mapToResponse(classEntity);
    }

    @Transactional
    public ClassResponse updateClass(Long id, ClassDto dto) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));

        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + dto.getCourseId()));

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + dto.getTeacherId()));

        classEntity.setCourse(course);
        classEntity.setTeacher(teacher);
        classEntity.setClassName(dto.getClassName());
        classEntity.setRoom(dto.getRoom());
        classEntity.setScheduleDay(dto.getScheduleDay());
        classEntity.setStartTime(dto.getStartTime());
        classEntity.setEndTime(dto.getEndTime());

        classEntity = classRepository.save(classEntity);
        return mapToResponse(classEntity);
    }

    @Transactional
    public void deleteClass(Long id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        classRepository.delete(classEntity);
    }

    @Transactional
    public void enrollStudent(Long classId, Long studentId) {
        if (enrollmentRepository.existsByStudent_IdAndClassEntity_Id(studentId, classId)) {
            throw new ConflictException("Student is already enrolled in this class");
        }

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        Enrollment enrollment = new Enrollment(student, classEntity);
        enrollmentRepository.save(enrollment);
    }

    @Transactional
    public void unenrollStudent(Long classId, Long studentId) {
        enrollmentRepository.deleteByStudent_IdAndClassEntity_Id(studentId, classId);
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> getEnrolledStudents(Long classId) {
        List<Enrollment> enrollments = enrollmentRepository.findByClassEntity_Id(classId);
        return enrollments.stream()
                .map(e -> studentService.mapToResponse(e.getStudent()))
                .collect(Collectors.toList());
    }

    public ClassResponse mapToResponse(ClassEntity c) {
        ClassResponse r = new ClassResponse();
        r.setId(c.getId());
        r.setClassName(c.getClassName());
        r.setRoom(c.getRoom());
        r.setScheduleDay(c.getScheduleDay());
        r.setStartTime(c.getStartTime());
        r.setEndTime(c.getEndTime());
        r.setCreatedAt(c.getCreatedAt());
        if (c.getCourse() != null) {
            r.setCourseId(c.getCourse().getId());
            r.setCourseCode(c.getCourse().getCourseCode());
            r.setCourseName(c.getCourse().getCourseName());
        }
        if (c.getTeacher() != null) {
            r.setTeacherId(c.getTeacher().getId());
            r.setTeacherName(c.getTeacher().getFirstName() + " " + c.getTeacher().getLastName());
        }
        r.setEnrolledCount(enrollmentRepository.findByClassEntity_Id(c.getId()).size());
        return r;
    }
}
