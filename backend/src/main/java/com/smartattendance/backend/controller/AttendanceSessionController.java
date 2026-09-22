package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.request.AttendanceSessionRequest;
import com.smartattendance.backend.dto.response.AttendanceSessionResponse;
import com.smartattendance.backend.security.UserPrincipal;
import com.smartattendance.backend.service.AttendanceSessionService;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/attendance/sessions", "/api/sessions"})
public class AttendanceSessionController {

    private final AttendanceSessionService sessionService;
    private final ExcelExportService excelExportService;

    public AttendanceSessionController(AttendanceSessionService sessionService, ExcelExportService excelExportService) {
        this.sessionService = sessionService;
        this.excelExportService = excelExportService;
    }

    @GetMapping
    public ResponseEntity<List<AttendanceSessionResponse>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/active")
    public ResponseEntity<List<AttendanceSessionResponse>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttendanceSessionResponse> getSessionById(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<AttendanceSessionResponse> createSession(
            @Valid @RequestBody AttendanceSessionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long teacherUserId = (currentUser != null) ? currentUser.getId() : null;
        return new ResponseEntity<>(sessionService.createSession(request, teacherUserId), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<AttendanceSessionResponse> startSession(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.startSession(id));
    }

    @PutMapping("/{id}/stop")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<AttendanceSessionResponse> stopSession(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.stopSession(id));
    }

    @PutMapping("/{id}/location")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<AttendanceSessionResponse> updateSessionLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Double> locationData) {
        Double lat = locationData.get("latitude");
        Double lon = locationData.get("longitude");
        Double radius = locationData.get("allowedRadius");
        return ResponseEntity.ok(sessionService.updateSessionLocation(id, lat, lon, radius));
    }

    @GetMapping("/{id}/recipients")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<List<Map<String, Object>>> getSessionRecipients(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionRecipients(id));
    }

    @PostMapping({"/{id}/email", "/{id}/send-emails"})
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<Map<String, Object>> sendAttendanceEmail(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.sendAttendanceEmails(id));
    }

    @GetMapping({"/{id}/export", "/{id}/export-excel"})
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<byte[]> exportSessionAttendanceExcel(@PathVariable Long id) throws IOException {
        byte[] excelBytes = excelExportService.generateSessionAttendanceExcel(id);
        String filename = "attendance_session_" + id + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
}
