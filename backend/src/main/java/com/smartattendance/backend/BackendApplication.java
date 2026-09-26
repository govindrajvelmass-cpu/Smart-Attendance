package com.smartattendance.backend;

import com.smartattendance.backend.config.DotenvLoader;
import com.smartattendance.backend.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class BackendApplication {

    private static final Logger log = LoggerFactory.getLogger(BackendApplication.class);

    static {
        DotenvLoader.load();
    }

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public ApplicationRunner startupStatusRunner(DataSource dataSource, EmailService emailService) {
        return args -> {
            String dbStatus = "FAILED";
            try (Connection conn = dataSource.getConnection()) {
                if (conn.isValid(3)) {
                    String productName = conn.getMetaData().getDatabaseProductName();
                    dbStatus = "CONNECTED (" + productName + ")";
                }
            } catch (Exception e) {
                dbStatus = "FAILED: " + e.getMessage();
            }

            String host = DotenvLoader.getProperty("MAIL_HOST", "smtp.gmail.com");
            String port = DotenvLoader.getProperty("MAIL_PORT", "587");
            String username = DotenvLoader.getProperty("MAIL_USERNAME", "");
            String password = DotenvLoader.getProperty("MAIL_PASSWORD", "");
            String from = DotenvLoader.getProperty("MAIL_FROM", username);

            boolean hostSet = host != null && !host.trim().isEmpty();
            boolean portSet = port != null && !port.trim().isEmpty();
            boolean userSet = username != null && !username.trim().isEmpty();
            boolean passSet = password != null && !password.trim().isEmpty();
            boolean fromSet = from != null && !from.trim().isEmpty();
            boolean configured = userSet && passSet;

            java.io.File envFile = DotenvLoader.findEnvFile();
            String envPath = envFile != null ? envFile.getAbsolutePath() : "NOT FOUND";

            System.out.println("\n==========================================================");
            System.out.println("SMART ATTENDANCE — BACKEND STARTUP DIAGNOSTICS");
            System.out.println("==========================================================");
            String portNum = DotenvLoader.getProperty("PORT", "8080");
            System.out.println("Database: " + dbStatus);
            System.out.println("Server: RUNNING on port " + portNum);
            System.out.println(".env file: " + envPath);
            System.out.println("\nSMTP Configuration & Diagnostic:");
            System.out.println("SMTP host: " + (hostSet ? host : "not configured"));
            System.out.println("SMTP port: " + (portSet ? port : "not configured"));
            System.out.println("SMTP username: " + (userSet ? username : "not configured"));
            System.out.println("whether MAIL_PASSWORD exists: " + (passSet ? "true" : "false"));
            System.out.println("password length only: " + (passSet ? password.length() : 0));
            System.out.println("MAIL_FROM: " + (fromSet ? from : "not configured"));
            System.out.println("----------------------------------------------------------");
            System.out.println("SMTP configuration loaded: YES");

            if (configured) {
                System.out.println("SMTP transporter created: YES (host=" + host + ", port=" + port + ", STARTTLS)");
                try {
                    emailService.getOrCreateMailSender().testConnection();
                    System.out.println("transporter.verify() / testConnection(): SUCCESS");
                    System.out.println("SMTP verification result: VERIFIED");
                } catch (Exception e) {
                    String msg = e.getMessage() != null ? e.getMessage() : e.toString();
                    System.out.println("transporter.verify() / testConnection(): FAILED");
                    System.out.println("Exact SMTP verification error: " + msg);
                    if (msg.contains("535") || msg.toLowerCase().contains("username and password not accepted")) {
                        System.out.println("-> Diagnosis: SMTP server is reachable, but Gmail rejected the credentials. The Gmail App Password or username needs to be corrected.");
                    }
                }
            } else {
                System.out.println("SMTP transporter created: NO (MAIL_USERNAME / MAIL_PASSWORD missing in backend/.env)");
                System.out.println("SMTP connection test: SKIPPED (credentials missing in backend/.env)");
            }
            System.out.println("==========================================================\n");

            log.info("Database: {}", dbStatus);
            log.info("SMTP configured: {}", configured ? "YES" : "NO");
            log.info("Server: RUNNING on port {}", portNum);
        };
    }

    private static String maskEmail(String email) {
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
