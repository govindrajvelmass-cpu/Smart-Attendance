package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.request.TeacherDto;
import com.smartattendance.backend.dto.response.ApiResponse;
import com.smartattendance.backend.dto.response.ClassResponse;
import com.smartattendance.backend.dto.response.TeacherResponse;
import com.smartattendance.backend.service.TeacherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    @GetMapping
    public ResponseEntity<List<TeacherResponse>> getAllTeachers() {
        return ResponseEntity.ok(teacherService.getAllTeachers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherResponse> getTeacherById(@PathVariable Long id) {
        return ResponseEntity.ok(teacherService.getTeacherById(id));
    }

    @GetMapping("/{id}/classes")
    public ResponseEntity<List<ClassResponse>> getAssignedClasses(@PathVariable Long id) {
        return ResponseEntity.ok(teacherService.getAssignedClasses(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<TeacherResponse> createTeacher(@Valid @RequestBody TeacherDto dto) {
        return new ResponseEntity<>(teacherService.createTeacher(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<TeacherResponse> updateTeacher(@PathVariable Long id, @Valid @RequestBody TeacherDto dto) {
        return ResponseEntity.ok(teacherService.updateTeacher(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Long id) {
        teacherService.deleteTeacher(id);
        return ResponseEntity.ok(ApiResponse.ok("Teacher deleted successfully"));
    }
}
