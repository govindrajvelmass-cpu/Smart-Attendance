package com.smartattendance.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class DotenvLoader {

    private static final Logger log = LoggerFactory.getLogger(DotenvLoader.class);
    private static boolean loaded = false;

    public static synchronized void reload() {
        loaded = false;
        load();
    }

    public static File findEnvFile() {
        String userDir = System.getProperty("user.dir", ".");
        List<File> candidates = new ArrayList<>();
        candidates.add(new File(userDir, ".env"));
        candidates.add(new File(userDir, "backend/.env"));
        candidates.add(new File(userDir, "../backend/.env"));
        candidates.add(new File(userDir, "../.env"));
        candidates.add(new File("C:\\Users\\GOVINDARAJ\\OneDrive\\Desktop\\Smart_Attendance\\backend\\.env"));
        candidates.add(new File("C:\\Users\\GOVINDARAJ\\OneDrive\\Desktop\\Smart_Attendance\\.env"));

        for (File f : candidates) {
            if (f.exists() && f.isFile()) {
                return f;
            }
        }
        return null;
    }

    public static String getProperty(String key, String defaultValue) {
        String val = checkKey(key);
        if (val != null) return val;

        // Fallback aliases
        if (key.equalsIgnoreCase("MAIL_USERNAME") || key.equalsIgnoreCase("SMTP_USER")) {
            for (String k : new String[]{"MAIL_USERNAME", "SMTP_USER", "EMAIL_USER", "MAIL_USER"}) {
                val = checkKey(k);
                if (val != null) return val;
            }
        } else if (key.equalsIgnoreCase("MAIL_PASSWORD") || key.equalsIgnoreCase("SMTP_PASSWORD")) {
            for (String k : new String[]{"MAIL_PASSWORD", "SMTP_PASSWORD", "SMTP_PASS", "MAIL_PASS", "EMAIL_PASSWORD"}) {
                val = checkKey(k);
                if (val != null) return val;
            }
        } else if (key.equalsIgnoreCase("MAIL_HOST") || key.equalsIgnoreCase("SMTP_HOST")) {
            for (String k : new String[]{"MAIL_HOST", "SMTP_HOST", "EMAIL_HOST"}) {
                val = checkKey(k);
                if (val != null) return val;
            }
        } else if (key.equalsIgnoreCase("MAIL_PORT") || key.equalsIgnoreCase("SMTP_PORT")) {
            for (String k : new String[]{"MAIL_PORT", "SMTP_PORT", "EMAIL_PORT"}) {
                val = checkKey(k);
                if (val != null) return val;
            }
        } else if (key.equalsIgnoreCase("MAIL_FROM") || key.equalsIgnoreCase("SMTP_FROM")) {
            for (String k : new String[]{"MAIL_FROM", "SMTP_FROM", "EMAIL_FROM"}) {
                val = checkKey(k);
                if (val != null) return val;
            }
        }

        return defaultValue;
    }

    private static String checkKey(String key) {
        String env = System.getenv(key);
        if (env != null && !env.trim().isEmpty()) {
            return env.trim();
        }
        String prop = System.getProperty(key);
        if (prop != null && !prop.trim().isEmpty()) {
            return prop.trim();
        }
        return null;
    }

    public static synchronized void load() {
        if (loaded) {
            return;
        }

        File envFile = findEnvFile();

        if (envFile != null) {
            log.info("Loading environment configuration from: {}", envFile.getAbsolutePath());
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    int eqIdx = line.indexOf('=');
                    if (eqIdx > 0) {
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();

                        // Strip quotes or inline comments
                        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                            if (value.length() >= 2) {
                                value = value.substring(1, value.length() - 1).trim();
                            }
                        } else {
                            int hashIdx = value.indexOf('#');
                            if (hashIdx >= 0) {
                                value = value.substring(0, hashIdx).trim();
                            }
                        }

                        // Special handling for Gmail 16-character app passwords with spaces:
                        // Users often paste: "abcd efgh ijkl mnop" which has 19 characters with spaces.
                        if (key.equalsIgnoreCase("MAIL_PASSWORD") || key.equalsIgnoreCase("SMTP_PASSWORD") ||
                            key.equalsIgnoreCase("SMTP_PASS") || key.equalsIgnoreCase("MAIL_PASS") || key.equalsIgnoreCase("EMAIL_PASSWORD")) {
                            String stripped = value.replaceAll("\\s+", "");
                            if (stripped.length() == 16) {
                                value = stripped;
                            }
                        }

                        String osEnv = System.getenv(key);
                        if (osEnv == null || osEnv.trim().isEmpty()) {
                            System.setProperty(key, value);
                        } else {
                            System.setProperty(key, osEnv.trim());
                        }

                        // Provide automatic cross-compatibility between MAIL_* and SMTP_* aliases
                        if (key.equalsIgnoreCase("MAIL_HOST") || key.equalsIgnoreCase("SMTP_HOST")) {
                            System.setProperty("MAIL_HOST", value);
                            System.setProperty("SMTP_HOST", value);
                        }

                        if (key.equalsIgnoreCase("MAIL_PORT") || key.equalsIgnoreCase("SMTP_PORT")) {
                            System.setProperty("MAIL_PORT", value);
                            System.setProperty("SMTP_PORT", value);
                        }

                        if (key.equalsIgnoreCase("MAIL_USERNAME") || key.equalsIgnoreCase("SMTP_USER") || key.equalsIgnoreCase("EMAIL_USER") || key.equalsIgnoreCase("MAIL_USER")) {
                            System.setProperty("MAIL_USERNAME", value);
                            System.setProperty("SMTP_USER", value);
                            System.setProperty("EMAIL_USER", value);
                            System.setProperty("MAIL_USER", value);
                        }

                        if (key.equalsIgnoreCase("MAIL_PASSWORD") || key.equalsIgnoreCase("SMTP_PASSWORD") || key.equalsIgnoreCase("SMTP_PASS") || key.equalsIgnoreCase("MAIL_PASS") || key.equalsIgnoreCase("EMAIL_PASSWORD")) {
                            System.setProperty("MAIL_PASSWORD", value);
                            System.setProperty("SMTP_PASSWORD", value);
                            System.setProperty("SMTP_PASS", value);
                            System.setProperty("MAIL_PASS", value);
                            System.setProperty("EMAIL_PASSWORD", value);
                        }

                        if (key.equalsIgnoreCase("MAIL_FROM") || key.equalsIgnoreCase("SMTP_FROM") || key.equalsIgnoreCase("EMAIL_FROM")) {
                            System.setProperty("MAIL_FROM", value);
                            System.setProperty("SMTP_FROM", value);
                            System.setProperty("EMAIL_FROM", value);
                        }
                    }
                }
            } catch (IOException e) {
                log.warn("Could not read .env file: {}", e.getMessage());
            }
        } else {
            log.info("No .env file found in search paths. Using existing system/environment variables.");
        }

        parseDatabaseUrl();

        loaded = true;
    }

    private static void parseDatabaseUrl() {
        String dbUrl = checkKey("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = checkKey("MYSQL_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = checkKey("SPRING_DATASOURCE_URL");
        }

        if (dbUrl != null && !dbUrl.isBlank() && dbUrl.startsWith("mysql://")) {
            try {
                java.net.URI uri = new java.net.URI(dbUrl);
                String userInfo = uri.getUserInfo();
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 3306 : uri.getPort();
                String path = uri.getPath();
                if (path != null && path.startsWith("/")) {
                    path = path.substring(1);
                }
                String query = uri.getQuery();

                String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + (path != null ? path : "");
                if (query != null && !query.isEmpty()) {
                    jdbcUrl += "?" + query;
                } else {
                    jdbcUrl += "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
                }

                System.setProperty("spring.datasource.url", jdbcUrl);
                System.setProperty("SPRING_DATASOURCE_URL", jdbcUrl);

                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    System.setProperty("spring.datasource.username", parts[0]);
                    System.setProperty("SPRING_DATASOURCE_USERNAME", parts[0]);
                    System.setProperty("spring.datasource.password", parts[1]);
                    System.setProperty("SPRING_DATASOURCE_PASSWORD", parts[1]);
                }
                log.info("Auto-converted MySQL connection URL to JDBC format for host: {}:{}", host, port);
            } catch (Exception e) {
                log.warn("Could not parse mysql:// URL: {}", e.getMessage());
            }
        }
    }

    public static void printStartupCheck() {
        String host = getProperty("MAIL_HOST", "smtp.gmail.com");
        String port = getProperty("MAIL_PORT", "587");
        String username = getProperty("MAIL_USERNAME", "");
        String password = getProperty("MAIL_PASSWORD", "");
        String from = getProperty("MAIL_FROM", username);

        boolean userSet = username != null && !username.trim().isEmpty() && !username.equalsIgnoreCase("YOUR_EMAIL");
        boolean passSet = password != null && !password.trim().isEmpty() && !password.equalsIgnoreCase("YOUR_GMAIL_APP_PASSWORD") && !password.startsWith("YOUR_");
        boolean configured = userSet && passSet;

        File env = findEnvFile();
        String envPath = env != null ? env.getAbsolutePath() : "NOT FOUND (checked user.dir and backend/.env)";

        log.info("==========================================================");
        log.info("SMART ATTENDANCE — SMTP CONFIGURATION STATUS");
        log.info("==========================================================");
        log.info(".env file detected: {}", envPath);
        log.info("SMTP configured: {}", configured ? "YES" : "NO");
        log.info("SMTP host: {}", host);
        log.info("SMTP port: {}", port);
        log.info("SMTP username configured: {}", userSet ? "YES (" + maskEmail(username) + ")" : "NO");
        log.info("SMTP password configured: {}", passSet ? "YES (masked for security)" : "NO");
        log.info("SMTP sender (MAIL_FROM): {}", (from != null && !from.trim().isEmpty()) ? maskEmail(from) : "Not set");
        if (!configured) {
            log.warn("[SMTP NOTICE] SMTP credentials missing in backend/.env.");
            log.warn("To enable real email sending to students:");
            log.warn("  1. Open backend/.env");
            log.warn("  2. Set MAIL_USERNAME=<your email>");
            log.warn("  3. Set MAIL_PASSWORD=<your 16-character Gmail App Password>");
        }
        log.info("==========================================================");
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
