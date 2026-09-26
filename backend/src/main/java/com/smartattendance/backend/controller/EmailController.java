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

    @PostMapping("/configure")
    public ResponseEntity<Map<String, Object>> configureSmtp(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String from = body.get("from");
        String brevoKey = body.get("brevoApiKey");
        if (brevoKey == null) brevoKey = body.get("brevoKey");
        String resendKey = body.get("resendApiKey");
        if (resendKey == null) resendKey = body.get("resendKey");
        String relayUrl = body.get("mailRelayUrl");
        if (relayUrl == null) relayUrl = body.get("relayUrl");
        if (relayUrl == null) relayUrl = body.get("googleScriptUrl");
        return ResponseEntity.ok(emailService.updateCredentials(username, password, from, brevoKey, resendKey, relayUrl));
    }
}
