package com.smartattendance.backend.controller;

import com.smartattendance.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getEmailStatus() {
        return ResponseEntity.ok(emailService.getSmtpStatus());
    }

    @RequestMapping(value = "/test", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> testSmtpConnection() {
        return ResponseEntity.ok(emailService.getSmtpStatus());
    }
}
