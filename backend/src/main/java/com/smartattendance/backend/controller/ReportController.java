package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.response.AttendanceReportResponse;
import com.smartattendance.backend.entity.AttendanceStatus;
import com.smartattendance.backend.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/attendance")
    public ResponseEntity<AttendanceReportResponse> getAttendanceReport(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) AttendanceStatus status) {
        return ResponseEntity.ok(reportService.getAttendanceReport(studentId, classId, startDate, endDate, status));
    }

    @GetMapping("/attendance/export")
    public ResponseEntity<byte[]> exportAttendanceReportCsv(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) AttendanceStatus status) {

        byte[] csvData = reportService.exportAttendanceCsv(studentId, classId, startDate, endDate, status);
        String filename = "attendance_report_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/attendance/student/{studentId}")
    public ResponseEntity<AttendanceReportResponse> getStudentReport(@PathVariable Long studentId) {
        return ResponseEntity.ok(reportService.getAttendanceReport(studentId, null, null, null, null));
    }

    @GetMapping("/attendance/class/{classId}")
    public ResponseEntity<AttendanceReportResponse> getClassReport(@PathVariable Long classId) {
        return ResponseEntity.ok(reportService.getAttendanceReport(null, classId, null, null, null));
    }
}
