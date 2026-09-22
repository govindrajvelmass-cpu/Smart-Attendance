package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.response.DashboardStatsResponse;
import com.smartattendance.backend.security.UserPrincipal;
import com.smartattendance.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping({"/admin", "/hod"})
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<DashboardStatsResponse> getHodDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboardStats());
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasAnyRole('HOD', 'TEACHER')")
    public ResponseEntity<DashboardStatsResponse> getTeacherDashboard(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(dashboardService.getTeacherDashboardStats(currentUser.getId()));
    }

    @GetMapping("/student")
    @PreAuthorize("hasAnyRole('HOD', 'STUDENT')")
    public ResponseEntity<DashboardStatsResponse> getStudentDashboard(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(dashboardService.getStudentDashboardStats(currentUser.getId()));
    }
}
