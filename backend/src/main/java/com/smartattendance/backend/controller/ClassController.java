package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.request.ClassDto;
import com.smartattendance.backend.dto.request.EnrollmentRequest;
import com.smartattendance.backend.dto.response.ApiResponse;
import com.smartattendance.backend.dto.response.ClassResponse;
import com.smartattendance.backend.dto.response.StudentResponse;
import com.smartattendance.backend.service.ClassService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    @GetMapping
    public ResponseEntity<List<ClassResponse>> getAllClasses() {
        return ResponseEntity.ok(classService.getAllClasses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassResponse> getClassById(@PathVariable Long id) {
        return ResponseEntity.ok(classService.getClassById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ClassResponse> createClass(@Valid @RequestBody ClassDto dto) {
        return new ResponseEntity<>(classService.createClass(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ClassResponse> updateClass(@PathVariable Long id, @Valid @RequestBody ClassDto dto) {
        return ResponseEntity.ok(classService.updateClass(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<Void>> deleteClass(@PathVariable Long id) {
        classService.deleteClass(id);
        return ResponseEntity.ok(ApiResponse.ok("Class deleted successfully"));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<StudentResponse>> getEnrolledStudents(@PathVariable Long id) {
        return ResponseEntity.ok(classService.getEnrolledStudents(id));
    }

    @PostMapping("/{id}/enroll")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> enrollStudent(@PathVariable Long id, @Valid @RequestBody EnrollmentRequest request) {
        classService.enrollStudent(id, request.getStudentId());
        return ResponseEntity.ok(ApiResponse.ok("Student enrolled in class successfully"));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> unenrollStudent(@PathVariable Long id, @PathVariable Long studentId) {
        classService.unenrollStudent(id, studentId);
        return ResponseEntity.ok(ApiResponse.ok("Student unenrolled successfully"));
    }
}
