package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.request.MarkAttendanceRequest;
import com.smartattendance.backend.dto.request.UpdateAttendanceRequest;
import com.smartattendance.backend.dto.response.ApiResponse;
import com.smartattendance.backend.dto.response.AttendanceRecordResponse;
import com.smartattendance.backend.security.UserPrincipal;
import com.smartattendance.backend.service.AttendanceService;
import com.smartattendance.backend.service.ExcelExportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final ExcelExportService excelExportService;

    public AttendanceController(AttendanceService attendanceService, ExcelExportService excelExportService) {
        this.attendanceService = attendanceService;
        this.excelExportService = excelExportService;
    }

    @PostMapping("/mark")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<AttendanceRecordResponse> markAttendance(
            @Valid @RequestBody MarkAttendanceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        AttendanceRecordResponse record = attendanceService.markAttendance(request, currentUser.getId());
        return new ResponseEntity<>(record, HttpStatus.CREATED);
    }

    @GetMapping({"/token/{token}", "/student/token/{token}"})
    public ResponseEntity<Map<String, Object>> verifyAttendanceToken(@PathVariable String token) {
        return ResponseEntity.ok(attendanceService.verifyAttendanceToken(token));
    }

    @PostMapping("/location-verify")
    public ResponseEntity<Map<String, Object>> verifyLocation(@RequestBody Map<String, Object> body) {
        Long sessionId = Long.valueOf(body.get("sessionId").toString());
        Double lat = Double.valueOf(body.get("studentLatitude") != null ? body.get("studentLatitude").toString() : body.get("latitude").toString());
        Double lon = Double.valueOf(body.get("studentLongitude") != null ? body.get("studentLongitude").toString() : body.get("longitude").toString());
        return ResponseEntity.ok(attendanceService.verifyLocation(sessionId, lat, lon));
    }

    @PostMapping("/face-verify")
    public ResponseEntity<Map<String, Object>> verifyFace(@RequestBody Map<String, String> body) {
        Long studentId = Long.valueOf(body.get("studentId"));
        String faceEmbedding = body.get("faceEmbedding") != null ? body.get("faceEmbedding") : body.get("liveEmbedding");
        return ResponseEntity.ok(attendanceService.verifyFace(studentId, faceEmbedding));
    }

    @GetMapping("/student/today")
    @PreAuthorize("hasAnyRole('STUDENT', 'HOD')")
    public ResponseEntity<Map<String, Object>> getStudentTodayAttendance(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(attendanceService.getStudentTodayAttendance(currentUser.getId()));
    }

    @GetMapping("/student/today/export-excel")
    @PreAuthorize("hasAnyRole('STUDENT', 'HOD')")
    public ResponseEntity<byte[]> exportStudentTodayAttendanceExcel(@AuthenticationPrincipal UserPrincipal currentUser) throws IOException {
        byte[] excelBytes = excelExportService.generateStudentTodayAttendanceExcel(currentUser.getId());
        String filename = "today_attendance_" + LocalDate.now() + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceRecordResponse>> getAttendanceByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByStudent(studentId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<AttendanceRecordResponse>> getAttendanceByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByClass(classId));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<AttendanceRecordResponse>> getAttendanceBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(attendanceService.getAttendanceBySession(sessionId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<AttendanceRecordResponse> updateAttendance(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, request));
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<AttendanceRecordResponse> verifyAttendance(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String verificationStatus = (body != null && body.containsKey("status")) ? body.get("status") : "VERIFIED";
        return ResponseEntity.ok(attendanceService.verifyAttendance(id, verificationStatus));
    }

    @PostMapping("/face-enroll/{studentId}")
    @PreAuthorize("hasAnyRole('HOD', 'STUDENT')")
    public ResponseEntity<ApiResponse<Void>> enrollStudentFace(
            @PathVariable Long studentId,
            @RequestBody Map<String, String> body) {
        String embedding = body.get("faceEmbedding");
        if (embedding == null || embedding.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Face embedding is required"));
        }
        attendanceService.enrollStudentFace(studentId, embedding);
        return ResponseEntity.ok(ApiResponse.ok("Face representation enrolled successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> deleteAttendance(@PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.ok(ApiResponse.ok("Attendance record deleted successfully"));
    }
}
