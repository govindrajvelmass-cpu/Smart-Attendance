package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.request.LoginRequest;
import com.smartattendance.backend.dto.request.RefreshTokenRequest;
import com.smartattendance.backend.dto.request.RegisterRequest;
import com.smartattendance.backend.dto.response.ApiResponse;
import com.smartattendance.backend.dto.response.AuthResponse;
import com.smartattendance.backend.dto.response.UserSummaryDto;
import com.smartattendance.backend.security.UserPrincipal;
import com.smartattendance.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser != null) {
            authService.logout(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.ok("User logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserSummaryDto userSummary = authService.getCurrentUser(currentUser.getUsername());
        return ResponseEntity.ok(userSummary);
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.ok("Smart Attendance Backend is running"));
    }
}
