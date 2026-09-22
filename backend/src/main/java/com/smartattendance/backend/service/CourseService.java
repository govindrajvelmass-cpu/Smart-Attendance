package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.request.CourseDto;
import com.smartattendance.backend.dto.response.CourseResponse;
import com.smartattendance.backend.entity.Course;
import com.smartattendance.backend.exception.ConflictException;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        return mapToResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseDto dto) {
        if (courseRepository.existsByCourseCode(dto.getCourseCode())) {
            throw new ConflictException("Course code already exists: " + dto.getCourseCode());
        }

        Course course = new Course(
                dto.getCourseCode().toUpperCase().trim(),
                dto.getCourseName(),
                dto.getDescription(),
                dto.getCredits()
        );
        course = courseRepository.save(course);
        return mapToResponse(course);
    }

    @Transactional
    public CourseResponse updateCourse(Long id, CourseDto dto) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        String upperCode = dto.getCourseCode().toUpperCase().trim();
        if (!course.getCourseCode().equalsIgnoreCase(upperCode) && courseRepository.existsByCourseCode(upperCode)) {
            throw new ConflictException("Course code already exists: " + upperCode);
        }

        course.setCourseCode(upperCode);
        course.setCourseName(dto.getCourseName());
        course.setDescription(dto.getDescription());
        course.setCredits(dto.getCredits());

        course = courseRepository.save(course);
        return mapToResponse(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        courseRepository.delete(course);
    }

    public CourseResponse mapToResponse(Course c) {
        CourseResponse r = new CourseResponse();
        r.setId(c.getId());
        r.setCourseCode(c.getCourseCode());
        r.setCourseName(c.getCourseName());
        r.setDescription(c.getDescription());
        r.setCredits(c.getCredits());
        r.setCreatedAt(c.getCreatedAt());
        return r;
    }
}
