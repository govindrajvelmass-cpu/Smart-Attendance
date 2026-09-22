package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.request.StudentDto;
import com.smartattendance.backend.dto.response.ApiResponse;
import com.smartattendance.backend.dto.response.ClassResponse;
import com.smartattendance.backend.dto.response.StudentResponse;
import com.smartattendance.backend.entity.PendingStudent;
import com.smartattendance.backend.exception.BadRequestException;
import com.smartattendance.backend.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/students", "/api/hod/students"})
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/capacity")
    public ResponseEntity<Map<String, Object>> getCapacity() {
        return ResponseEntity.ok(studentService.getCapacityStatus());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @GetMapping("/{id}/activity")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER', 'STUDENT')")
    public ResponseEntity<Map<String, Object>> getStudentActivity(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentActivity(id));
    }

    @GetMapping("/{id}/classes")
    public ResponseEntity<List<ClassResponse>> getEnrolledClasses(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getEnrolledClasses(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<StudentResponse> createStudent(@Valid @RequestBody StudentDto dto) {
        return new ResponseEntity<>(studentService.createStudent(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'STUDENT')")
    public ResponseEntity<StudentResponse> updateStudent(@PathVariable Long id, @Valid @RequestBody StudentDto dto) {
        return ResponseEntity.ok(studentService.updateStudent(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.ok("Student deleted successfully"));
    }

    @PostMapping("/{id}/enroll-face")
    @PreAuthorize("hasAnyRole('HOD', 'STUDENT')")
    public ResponseEntity<ApiResponse<Void>> enrollFace(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String faceEmbedding = body.get("faceEmbedding");
        if (faceEmbedding == null || faceEmbedding.trim().isEmpty()) {
            throw new BadRequestException("Face embedding is required");
        }
        studentService.enrollStudentFace(id, faceEmbedding);
        return ResponseEntity.ok(ApiResponse.ok("Face representation enrolled successfully"));
    }

    // Pending student self-registration workflow
    @PostMapping("/register-request")
    public ResponseEntity<ApiResponse<PendingStudent>> registerRequest(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String name = body.get("fullName");
        String dept = body.get("department");
        String phone = body.get("phone");
        PendingStudent ps = studentService.submitRegistrationRequest(email, name, dept, phone);
        return new ResponseEntity<>(ApiResponse.ok("Registration request submitted successfully. Pending HOD approval.", ps), HttpStatus.CREATED);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<PendingStudent>> getPendingStudents() {
        return ResponseEntity.ok(studentService.getPendingStudents());
    }

    @PostMapping("/pending/{id}/approve")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<StudentResponse>> approvePendingStudent(@PathVariable Long id) {
        StudentResponse student = studentService.approvePendingStudent(id);
        return ResponseEntity.ok(ApiResponse.ok("Student approved and enrolled successfully", student));
    }

    @PostMapping("/pending/{id}/reject")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<PendingStudent>> rejectPendingStudent(@PathVariable Long id) {
        PendingStudent ps = studentService.rejectPendingStudent(id);
        return ResponseEntity.ok(ApiResponse.ok("Student registration request rejected", ps));
    }
}
