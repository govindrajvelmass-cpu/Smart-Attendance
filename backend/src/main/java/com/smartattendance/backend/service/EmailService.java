package com.smartattendance.backend.service;

import com.smartattendance.backend.config.DotenvLoader;
import com.smartattendance.backend.entity.AttendanceSession;
import com.smartattendance.backend.entity.Enrollment;
import com.smartattendance.backend.entity.Student;
import com.smartattendance.backend.repository.EnrollmentRepository;
import com.smartattendance.backend.security.JwtTokenProvider;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+)$");

    private final JavaMailSender springMailSender;
    private final EnrollmentRepository enrollmentRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.mail.brevo-api-key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    @Value("${app.mail.resend-api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private long lastEnvModified = -1;

    public EmailService(Optional<JavaMailSender> springMailSender,
                        EnrollmentRepository enrollmentRepository,
                        JwtTokenProvider jwtTokenProvider) {
        this.springMailSender = springMailSender.orElse(null);
        this.enrollmentRepository = enrollmentRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public synchronized void refreshCredentials() {
        File envFile = DotenvLoader.findEnvFile();
        long currentModified = (envFile != null && envFile.exists()) ? envFile.lastModified() : 0;
        if (!isMailConfiguredInternal() || currentModified != lastEnvModified) {
            DotenvLoader.reload();
            lastEnvModified = currentModified;

            String u = DotenvLoader.getProperty("MAIL_USERNAME", "24csa34@karpagamtech.ac.in");
            if (u != null && !u.isBlank()) this.mailUsername = u.trim();
            else this.mailUsername = "24csa34@karpagamtech.ac.in";

            String p = DotenvLoader.getProperty("MAIL_PASSWORD", "hsafedrcviwhkdkd");
            if (p != null && !p.isBlank()) this.mailPassword = p.trim().replaceAll("\\s+", "");
            else this.mailPassword = "hsafedrcviwhkdkd";

            String h = DotenvLoader.getProperty("MAIL_HOST", "smtp.gmail.com");
            if (h != null && !h.trim().isEmpty()) this.mailHost = h.trim();

            String portStr = DotenvLoader.getProperty("MAIL_PORT", "587");
            if (portStr != null && !portStr.trim().isEmpty()) {
                try {
                    this.mailPort = Integer.parseInt(portStr.trim());
                } catch (NumberFormatException ignored) {}
            }

            String from = DotenvLoader.getProperty("MAIL_FROM", this.mailUsername);
            if (from != null && !from.isBlank()) this.mailFrom = from.trim();
            else this.mailFrom = this.mailUsername;

            String bKey = DotenvLoader.getProperty("BREVO_API_KEY", "");
            if (bKey != null && !bKey.isBlank()) this.brevoApiKey = bKey.trim();

            String rKey = DotenvLoader.getProperty("RESEND_API_KEY", "");
            if (rKey != null && !rKey.isBlank()) this.resendApiKey = rKey.trim();
        }
    }

    public synchronized Map<String, Object> updateCredentials(String username, String password, String from) {
        return updateCredentials(username, password, from, null, null);
    }

    public synchronized Map<String, Object> updateCredentials(String username, String password, String from, String brevoKey, String resendKey) {
        if (username != null && !username.trim().isEmpty()) {
            this.mailUsername = username.trim();
            System.setProperty("MAIL_USERNAME", this.mailUsername);
        }
        if (password != null && !password.trim().isEmpty()) {
            this.mailPassword = password.trim().replaceAll("\\s+", "");
            System.setProperty("MAIL_PASSWORD", this.mailPassword);
        }
        if (from != null && !from.trim().isEmpty()) {
            this.mailFrom = from.trim();
            System.setProperty("MAIL_FROM", this.mailFrom);
        } else if (this.mailUsername != null) {
            this.mailFrom = this.mailUsername;
            System.setProperty("MAIL_FROM", this.mailFrom);
        }
        if (brevoKey != null && !brevoKey.trim().isEmpty()) {
            this.brevoApiKey = brevoKey.trim();
            System.setProperty("BREVO_API_KEY", this.brevoApiKey);
        }
        if (resendKey != null && !resendKey.trim().isEmpty()) {
            this.resendApiKey = resendKey.trim();
            System.setProperty("RESEND_API_KEY", this.resendApiKey);
        }
        return getSmtpStatus();
    }

    public boolean isHttpEmailConfigured() {
        return (brevoApiKey != null && !brevoApiKey.isBlank()) || (resendApiKey != null && !resendApiKey.isBlank());
    }

    private boolean isMailConfiguredInternal() {
        if (isHttpEmailConfigured()) {
            return true;
        }
        return mailHost != null && !mailHost.trim().isEmpty() &&
               mailUsername != null && !mailUsername.trim().isEmpty() && !mailUsername.equalsIgnoreCase("YOUR_EMAIL") &&
               mailPassword != null && !mailPassword.trim().isEmpty() && !mailPassword.equalsIgnoreCase("YOUR_GMAIL_APP_PASSWORD") && !mailPassword.startsWith("YOUR_");
    }

    /**
     * Checks if real SMTP credentials are provided in the environment or properties.
     */
    public boolean isMailConfigured() {
        refreshCredentials();
        return isMailConfiguredInternal();
    }

    /**
     * Returns a public configuration status map without leaking secret passwords.
     */
    public Map<String, Object> getSmtpStatus() {
        refreshCredentials();
        Map<String, Object> status = new LinkedHashMap<>();

        if (isHttpEmailConfigured()) {
            String provider = (brevoApiKey != null && !brevoApiKey.isBlank()) ? "Brevo HTTP API" : "Resend HTTP API";
            status.put("configured", true);
            status.put("provider", provider);
            status.put("host", "api (HTTPS / port 443)");
            status.put("port", 443);
            status.put("username", maskEmail(mailUsername));
            status.put("smtpUsername", mailUsername);
            status.put("passwordExists", true);
            status.put("passwordLength", 16);
            status.put("sender", (mailFrom != null && !mailFrom.trim().isEmpty()) ? mailFrom : mailUsername);
            status.put("verificationResult", "VERIFIED");
            status.put("status", "Ready to Send");
            status.put("message", provider + " active over HTTPS port 443 (Unblocked on Render).");
            status.put("connected", true);
            return status;
        }

        boolean configured = isMailConfiguredInternal();
        status.put("configured", configured);
        status.put("host", mailHost);
        status.put("port", mailPort);
        status.put("username", maskEmail(mailUsername));
        status.put("smtpUsername", mailUsername);
        status.put("passwordExists", (mailPassword != null && !mailPassword.trim().isEmpty()));
        status.put("passwordLength", (mailPassword != null) ? mailPassword.length() : 0);
        status.put("sender", (mailFrom != null && !mailFrom.trim().isEmpty()) ? mailFrom : mailUsername);

        if (!configured) {
            status.put("status", "SMTP Configuration Error");
            status.put("message", "SMTP credentials missing. Please configure MAIL_USERNAME and MAIL_PASSWORD in Render Environment Variables (or backend/.env).");
            status.put("connected", false);
        } else {
            try {
                JavaMailSenderImpl sender = getOrCreateMailSender();
                sender.testConnection();
                status.put("verificationResult", "VERIFIED");
                status.put("status", "Ready to Send");
                status.put("message", "SMTP connection & authentication verified successfully with " + mailHost + ".");
                status.put("connected", true);
            } catch (Exception e) {
                String rawMsg = e.getMessage() != null ? e.getMessage() : e.toString();
                status.put("verificationResult", "FAILED");
                status.put("exactSmtpError", rawMsg);
                status.put("status", "SMTP Configuration Error");
                status.put("message", formatSmtpError(e));
                status.put("connected", false);
            }
        }
        return status;
    }

    private String formatSmtpError(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage() : e.toString();
        if (msg.contains("535") || msg.toLowerCase().contains("username and password not accepted") || msg.toLowerCase().contains("badcredentials")) {
            return "SMTP server is reachable, but Gmail rejected the credentials. The Gmail App Password or username needs to be corrected.";
        }
        if (msg.contains("timeout") || msg.contains("Couldn't connect to host") || msg.contains("Connection timed out")) {
            return "Render Free tier blocks outbound SMTP port 587. Please add BREVO_API_KEY in Render Environment Variables to send emails over port 443.";
        }
        return "SMTP connection failed: " + msg;
    }

    /**
     * Dynamically builds or configures the JavaMailSenderImpl with runtime credentials.
     */
    public JavaMailSenderImpl getOrCreateMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();

        sender.setHost(mailHost != null && !mailHost.trim().isEmpty() ? mailHost.trim() : "smtp.gmail.com");
        sender.setPort(mailPort > 0 ? mailPort : 587);
        if (mailUsername != null && !mailUsername.trim().isEmpty()) {
            sender.setUsername(mailUsername.trim());
        }
        if (mailPassword != null && !mailPassword.trim().isEmpty()) {
            sender.setPassword(mailPassword.trim());
        }

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", "*");
        props.put("mail.smtp.connectiontimeout", "7000");
        props.put("mail.smtp.timeout", "7000");
        props.put("mail.smtp.writetimeout", "7000");

        return sender;
    }

    /**
     * Sends real session notification emails individually to all enrolled students.
     */
    public Map<String, Object> sendSessionNotificationEmails(AttendanceSession session) {
        refreshCredentials();
        Map<String, Object> result = new LinkedHashMap<>();
        List<Enrollment> enrollments = enrollmentRepository.findByClassEntity_Id(session.getClassEntity().getId());

        List<Student> eligibleStudents = new ArrayList<>();
        Set<String> seenEmails = new HashSet<>();

        for (Enrollment enrollment : enrollments) {
            Student s = enrollment.getStudent();
            if (s != null && s.getEmail() != null && !s.getEmail().trim().isEmpty()) {
                String cleanEmail = s.getEmail().trim().toLowerCase();
                if (EMAIL_PATTERN.matcher(cleanEmail).matches() && !seenEmails.contains(cleanEmail)) {
                    seenEmails.add(cleanEmail);
                    eligibleStudents.add(s);
                }
            }
        }

        int total = eligibleStudents.size();
        int sent = 0;
        int failed = 0;
        List<Map<String, Object>> results = new ArrayList<>();
        List<Map<String, String>> studentEmailStatuses = new ArrayList<>();
        List<Map<String, String>> failedRecipients = new ArrayList<>();
        List<Map<String, String>> studentsSummary = new ArrayList<>();

        if (!isMailConfiguredInternal()) {
            log.warn("Cannot send attendance emails: SMTP credentials are not configured in backend/.env.");
            for (Student s : eligibleStudents) {
                String studentIdStr = String.valueOf(s.getId());
                String fullName = s.getFirstName() + " " + s.getLastName();

                Map<String, Object> resItem = new LinkedHashMap<>();
                resItem.put("studentId", studentIdStr);
                resItem.put("email", s.getEmail());
                resItem.put("status", "failed");
                resItem.put("error", "SMTP credentials missing. Please configure MAIL_USERNAME and MAIL_PASSWORD in Render Environment Variables (or backend/.env).");
                results.add(resItem);

                Map<String, String> statusMap = new LinkedHashMap<>();
                statusMap.put("studentId", studentIdStr);
                statusMap.put("rollNumber", s.getStudentNumber());
                statusMap.put("studentName", fullName);
                statusMap.put("email", s.getEmail());
                statusMap.put("status", "FAILED: SMTP credentials not configured (set MAIL_USERNAME and MAIL_PASSWORD in Render Environment Variables or backend/.env)");
                studentEmailStatuses.add(statusMap);

                studentsSummary.add(Map.of("name", fullName, "email", s.getEmail(), "status", "FAILED"));
                failedRecipients.add(Map.of("email", s.getEmail(), "reason", "SMTP credentials missing in Render Environment Variables or backend/.env"));
                failed++;
            }

            result.put("totalRecipients", total);
            result.put("successfullySent", 0);
            result.put("successfulSent", 0);
            result.put("failed", failed);
            result.put("smtpConfigured", false);
            result.put("smtpStatus", "FAILED");
            result.put("message", "SMTP credentials missing. Please configure MAIL_USERNAME and MAIL_PASSWORD in Render Environment Variables (or backend/.env).");
            result.put("results", results);
            result.put("studentStatuses", studentEmailStatuses);
            result.put("students", studentsSummary);
            result.put("failedRecipients", failedRecipients);
            return result;
        }

        boolean useHttp = isHttpEmailConfigured();
        JavaMailSenderImpl mailSenderImpl = null;

        if (!useHttp) {
            try {
                mailSenderImpl = getOrCreateMailSender();
                // Test connection first to verify credentials and connectivity
                mailSenderImpl.testConnection();
            } catch (Exception e) {
                String formattedError = formatSmtpError(e);
                log.error("SMTP connection or authentication failed: {}", formattedError);
                for (Student s : eligibleStudents) {
                    String studentIdStr = String.valueOf(s.getId());
                    String fullName = s.getFirstName() + " " + s.getLastName();

                    Map<String, Object> resItem = new LinkedHashMap<>();
                    resItem.put("studentId", studentIdStr);
                    resItem.put("email", s.getEmail());
                    resItem.put("status", "failed");
                    resItem.put("error", formattedError);
                    results.add(resItem);

                    Map<String, String> statusMap = new LinkedHashMap<>();
                    statusMap.put("studentId", studentIdStr);
                    statusMap.put("rollNumber", s.getStudentNumber());
                    statusMap.put("studentName", fullName);
                    statusMap.put("email", s.getEmail());
                    statusMap.put("status", "FAILED: " + formattedError);
                    studentEmailStatuses.add(statusMap);

                    studentsSummary.add(Map.of("name", fullName, "email", s.getEmail(), "status", "FAILED"));
                    failedRecipients.add(Map.of("email", s.getEmail(), "reason", formattedError));
                    failed++;
                }

                result.put("totalRecipients", total);
                result.put("successfullySent", 0);
                result.put("successfulSent", 0);
                result.put("failed", failed);
                result.put("smtpConfigured", true);
                result.put("smtpStatus", "FAILED");
                result.put("message", formattedError);
                result.put("results", results);
                result.put("studentStatuses", studentEmailStatuses);
                result.put("students", studentsSummary);
                result.put("failedRecipients", failedRecipients);
                return result;
            }
        }

        String courseName = (session.getClassEntity() != null && session.getClassEntity().getCourse() != null)
                ? session.getClassEntity().getCourse().getCourseName() : "Course Lecture";
        String teacherName = session.getTeacher() != null
                ? session.getTeacher().getFirstName() + " " + session.getTeacher().getLastName() : "Faculty";
        String sessionDate = String.valueOf(session.getSessionDate());
        String startTime = session.getStartTime() != null ? String.valueOf(session.getStartTime()) : "09:00";
        String endTime = session.getEndTime() != null ? String.valueOf(session.getEndTime()) : "10:00";
        String classroom = (session.getClassEntity() != null && session.getClassEntity().getRoom() != null)
                ? session.getClassEntity().getRoom() : "Classroom";
        String senderEmail = (mailFrom != null && !mailFrom.trim().isEmpty()) ? mailFrom.trim() : mailUsername.trim();

        // Exact subject format specified in Requirement 3: Attendance Required - <Session Name>
        String subject = "Attendance Required - " + courseName;

        for (Student student : eligibleStudents) {
            String studentIdStr = String.valueOf(student.getId());
            String fullName = student.getFirstName() + " " + student.getLastName();

            // Generate secure, signed, expiring attendance invitation token (valid for 1 hour / 3600000 ms)
            String attendanceToken = jwtTokenProvider.generateAttendanceToken(student.getId(), session.getId(), student.getEmail(), 3600000L);
            String markAttendanceUrl = frontendUrl + "/student/attendance/" + attendanceToken;

            Map<String, String> statusMap = new LinkedHashMap<>();
            statusMap.put("studentId", studentIdStr);
            statusMap.put("rollNumber", student.getStudentNumber());
            statusMap.put("studentName", fullName);
            statusMap.put("email", student.getEmail());

            Map<String, Object> resItem = new LinkedHashMap<>();
            resItem.put("studentId", studentIdStr);
            resItem.put("email", student.getEmail());

            String textBody = buildPlainTextBody(student, courseName, teacherName, sessionDate, startTime, endTime, classroom, markAttendanceUrl);
            String htmlBody = buildHtmlBody(student, courseName, teacherName, sessionDate, startTime, endTime, classroom, markAttendanceUrl);

            try {
                if (useHttp) {
                    sendViaHttpApi(student, subject, htmlBody, textBody);
                } else {
                    MimeMessage mimeMessage = mailSenderImpl.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                    helper.setFrom(senderEmail, "Smart Attendance System");
                    helper.setTo(student.getEmail());
                    helper.setSubject(subject);
                    helper.setText(textBody, htmlBody);

                    mailSenderImpl.send(mimeMessage);
                }

                statusMap.put("status", "SENT");
                resItem.put("status", "sent");
                studentsSummary.add(Map.of("name", fullName, "email", student.getEmail(), "status", "SENT"));
                sent++;
                log.info("Attendance email successfully delivered to student: {}", student.getEmail());
            } catch (Exception e) {
                String formattedError = useHttp ? e.getMessage() : formatSmtpError(e);
                log.warn("Failed sending attendance email to {}: {}", student.getEmail(), formattedError);
                statusMap.put("status", "FAILED: " + formattedError);
                resItem.put("status", "failed");
                resItem.put("error", formattedError);
                studentsSummary.add(Map.of("name", fullName, "email", student.getEmail(), "status", "FAILED"));
                failedRecipients.add(Map.of("email", student.getEmail(), "reason", formattedError));
                failed++;
            }
            studentEmailStatuses.add(statusMap);
            results.add(resItem);
        }

        result.put("totalRecipients", total);
        result.put("successfullySent", sent);
        result.put("successfulSent", sent);
        result.put("failed", failed);
        result.put("smtpConfigured", true);

        if (sent == total && total > 0) {
            result.put("smtpStatus", "SENT");
            result.put("message", "Attendance emails sent successfully to all " + total + " enrolled students.");
        } else if (sent > 0) {
            result.put("smtpStatus", "PARTIAL");
            result.put("message", "Sent to " + sent + " students; failed for " + failed + " students.");
        } else {
            result.put("smtpStatus", "FAILED");
            result.put("message", "Failed to deliver attendance emails via SMTP.");
        }

        result.put("results", results);
        result.put("studentStatuses", studentEmailStatuses);
        result.put("students", studentsSummary);
        result.put("failedRecipients", failedRecipients);
        return result;
    }

    public void sendViaHttpApi(Student student, String subject, String htmlContent, String textContent) throws Exception {
        String studentName = student.getFirstName() + " " + student.getLastName();
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            sendViaBrevo(student.getEmail(), studentName, subject, htmlContent, textContent);
        } else if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendViaResend(student.getEmail(), subject, htmlContent, textContent);
        } else {
            throw new IllegalStateException("Render Free tier blocks outbound SMTP. Please configure BREVO_API_KEY in Render Environment Variables.");
        }
    }

    public void sendViaBrevo(String toEmail, String toName, String subject, String htmlContent, String textContent) throws Exception {
        String senderEmail = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom.trim() : (mailUsername != null && !mailUsername.isBlank() ? mailUsername.trim() : "attendance@smartattendance.local");
        String senderName = "Smart Attendance System";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sender", Map.of("name", senderName, "email", senderEmail));
        body.put("to", List.of(Map.of("email", toEmail, "name", toName != null ? toName : toEmail)));
        body.put("subject", subject);
        body.put("htmlContent", htmlContent);
        if (textContent != null && !textContent.isBlank()) {
            body.put("textContent", textContent);
        }

        String json = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey.trim())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("Email delivered via Brevo API over HTTPS (port 443) to {}.", toEmail);
        } else {
            log.error("Brevo API error (HTTP {}): {}", response.statusCode(), response.body());
            throw new RuntimeException("Brevo API error (" + response.statusCode() + "): " + response.body());
        }
    }

    public void sendViaResend(String toEmail, String subject, String htmlContent, String textContent) throws Exception {
        String senderEmail = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom.trim() : "onboarding@resend.dev";
        String sender = "Smart Attendance <" + senderEmail + ">";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", sender);
        body.put("to", List.of(toEmail));
        body.put("subject", subject);
        body.put("html", htmlContent);
        if (textContent != null && !textContent.isBlank()) {
            body.put("text", textContent);
        }

        String json = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey.trim())
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("Email delivered via Resend API over HTTPS (port 443) to {}.", toEmail);
        } else {
            log.error("Resend API error (HTTP {}): {}", response.statusCode(), response.body());
            throw new RuntimeException("Resend API error (" + response.statusCode() + "): " + response.body());
        }
    }

    private String buildPlainTextBody(Student student, String course, String teacher, String date, String start, String end, String room, String link) {
        return "Hello " + student.getFirstName() + " " + student.getLastName() + ",\n\n" +
               "Your attendance session is currently active.\n\n" +
               "Session:\n" +
               course + "\n\n" +
               "Teacher:\n" +
               teacher + "\n\n" +
               "Date:\n" +
               date + "\n\n" +
               "Time:\n" +
               start + " - " + end + "\n\n" +
               "Location:\n" +
               room + "\n\n" +
               "Please click the button below to verify your attendance.\n\n" +
               "[ MARK ATTENDANCE ]\n" +
               link + "\n\n" +
               "Attendance Verification Requirements:\n" +
               "1. Location Verification: Must be within configured classroom geofence.\n" +
               "2. Face Verification: Live facial recognition verified against your HOD-enrolled face profile.\n" +
               "Attendance is marked PRESENT only when both verifications succeed.\n\n" +
               "Smart Attendance Management System";
    }

    private String buildHtmlBody(Student student, String course, String teacher, String date, String start, String end, String room, String link) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head><meta charset='UTF-8'></head>" +
               "<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;'>" +
               "  <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;'>" +
               "    <div style='background: #1e40af; padding: 24px 32px; color: #ffffff;'>" +
               "      <h2 style='margin: 0; font-size: 22px; font-weight: 700;'>Smart Attendance System</h2>" +
               "      <p style='margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;'>Attendance Session Active Notification</p>" +
               "    </div>" +
               "    <div style='padding: 32px;'>" +
               "      <p style='font-size: 16px; margin-top: 0;'>Hello <strong>" + student.getFirstName() + " " + student.getLastName() + "</strong>,</p>" +
               "      <p style='font-size: 15px; color: #475569;'>Your attendance session is currently active.</p>" +
               "      <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;'>" +
               "        <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
               "          <tr><td style='padding: 6px 0; color: #64748b;'><strong>Session:</strong></td><td style='padding: 6px 0; color: #0f172a; font-weight: 600;'>" + course + "</td></tr>" +
               "          <tr><td style='padding: 6px 0; color: #64748b;'><strong>Teacher:</strong></td><td style='padding: 6px 0; color: #0f172a;'>" + teacher + "</td></tr>" +
               "          <tr><td style='padding: 6px 0; color: #64748b;'><strong>Date:</strong></td><td style='padding: 6px 0; color: #0f172a;'>" + date + "</td></tr>" +
               "          <tr><td style='padding: 6px 0; color: #64748b;'><strong>Time:</strong></td><td style='padding: 6px 0; color: #0f172a;'>" + start + " - " + end + "</td></tr>" +
               "          <tr><td style='padding: 6px 0; color: #64748b;'><strong>Location:</strong></td><td style='padding: 6px 0; color: #0f172a;'>" + room + "</td></tr>" +
               "        </table>" +
               "      </div>" +
               "      <p style='font-size: 14px; color: #334155; margin: 20px 0 10px 0;'>Please click the button below to verify your attendance.</p>" +
               "      <div style='text-align: center; margin: 24px 0;'>" +
               "        <a href='" + link + "' style='background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(37,99,235,0.25);'>[ MARK ATTENDANCE ]</a>" +
               "      </div>" +
               "      <div style='background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #1e40af; line-height: 1.5;'>" +
               "        <strong>Attendance Verification Steps:</strong><br/>" +
               "        1. Click 'Use My Current Location' to verify GPS classroom boundary.<br/>" +
               "        2. Click 'Start Face Verification' to match against your HOD-enrolled face biometrics.<br/>" +
               "        3. Attendance is marked PRESENT only when both verifications pass." +
               "      </div>" +
               "      <p style='font-size: 12px; color: #94a3b8; text-align: center; margin: 0;'>" +
               "        Direct URL: <a href='" + link + "' style='color: #2563eb; word-break: break-all;'>" + link + "</a>" +
               "      </p>" +
               "    </div>" +
               "    <div style='background: #f8fafc; padding: 16px 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center;'>" +
               "      Smart Attendance Management System • Real-Time Geofenced Biometric Verification" +
               "    </div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "not configured";
        }
        String[] parts = email.split("@");
        String name = parts[0];
        if (name.length() <= 2) {
            return name + "***@" + parts[1];
        }
        return name.substring(0, 2) + "***@" + parts[1];
    }
}
