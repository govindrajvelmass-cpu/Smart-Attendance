-- ==========================================================
-- SMART ATTENDANCE MANAGEMENT SYSTEM - DATABASE SCHEMA & SEED
-- Database: MySQL 8.0+
-- File: database/smart_attendance.sql
-- ==========================================================

CREATE DATABASE IF NOT EXISTS smart_attendance 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE smart_attendance;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'TEACHER', 'STUDENT') NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teachers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher_emp (employee_number),
    INDEX idx_teacher_dept (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    student_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100) NOT NULL,
    year INT NOT NULL DEFAULT 1,
    section VARCHAR(20) NOT NULL DEFAULT 'A',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_num (student_number),
    INDEX idx_student_dept_sec (department, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    course_name VARCHAR(150) NOT NULL,
    description TEXT,
    credits INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_code (course_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    room VARCHAR(50),
    schedule_day VARCHAR(20),
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_class_teacher (teacher_id),
    INDEX idx_class_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enroll_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_enroll_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT uk_student_class UNIQUE (student_id, class_id),
    INDEX idx_enroll_student (student_id),
    INDEX idx_enroll_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    default_radius DOUBLE NOT NULL DEFAULT 50.0,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    allowed_radius DOUBLE NOT NULL DEFAULT 50.0,
    status ENUM('ACTIVE', 'CLOSED', 'SCHEDULED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_session_class_date (class_id, session_date),
    INDEX idx_session_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    attendance_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    distance_from_class DOUBLE,
    status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') NOT NULL,
    remarks VARCHAR(255),
    CONSTRAINT fk_att_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT uk_session_student UNIQUE (session_id, student_id),
    INDEX idx_att_student (student_id),
    INDEX idx_att_session (session_id),
    INDEX idx_att_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id, read_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data
INSERT INTO users (id, username, email, password, role, active) VALUES
(1, 'admin', 'admin@smartattendance.com', '$2a$10$D0ZSq7kwNyZYg29KVn6zvORF7HUgWsxj2Wf9XJXagZ3f0xUyc6E4O', 'ADMIN', TRUE),
(2, 'teacher1', 'teacher1@smartattendance.com', '$2a$10$xXjCEmSRkNhWee33lZqgPeJti9OxcWIduLbMMoGc5HFvoJKX/.cyy', 'TEACHER', TRUE),
(3, 'teacher2', 'teacher2@smartattendance.com', '$2a$10$xXjCEmSRkNhWee33lZqgPeJti9OxcWIduLbMMoGc5HFvoJKX/.cyy', 'TEACHER', TRUE),
(4, 'student1', 'student1@smartattendance.com', '$2a$10$dOdeIxME4Ca9r8jhNFG1Xupaw9rwrE06zKC2Kx/003U60i0q8ejN6', 'STUDENT', TRUE),
(5, 'student2', 'student2@smartattendance.com', '$2a$10$dOdeIxME4Ca9r8jhNFG1Xupaw9rwrE06zKC2Kx/003U60i0q8ejN6', 'STUDENT', TRUE),
(6, 'student3', 'student3@smartattendance.com', '$2a$10$dOdeIxME4Ca9r8jhNFG1Xupaw9rwrE06zKC2Kx/003U60i0q8ejN6', 'STUDENT', TRUE),
(7, 'student4', 'student4@smartattendance.com', '$2a$10$dOdeIxME4Ca9r8jhNFG1Xupaw9rwrE06zKC2Kx/003U60i0q8ejN6', 'STUDENT', TRUE),
(8, 'student5', 'student5@smartattendance.com', '$2a$10$dOdeIxME4Ca9r8jhNFG1Xupaw9rwrE06zKC2Kx/003U60i0q8ejN6', 'STUDENT', TRUE);

INSERT INTO teachers (id, user_id, employee_number, first_name, last_name, email, department) VALUES
(1, 2, 'EMP-1001', 'Dr. Ramesh', 'Sharma', 'teacher1@smartattendance.com', 'Computer Science & Engineering'),
(2, 3, 'EMP-1002', 'Prof. Ananya', 'Patel', 'teacher2@smartattendance.com', 'Information Technology');

INSERT INTO students (id, user_id, student_number, first_name, last_name, email, phone, department, year, section) VALUES
(1, 4, 'STU-2026-001', 'Aarav', 'Verma', 'student1@smartattendance.com', '+91-9876543210', 'Computer Science & Engineering', 3, 'A'),
(2, 5, 'STU-2026-002', 'Diya', 'Nair', 'student2@smartattendance.com', '+91-9876543211', 'Computer Science & Engineering', 3, 'A'),
(3, 6, 'STU-2026-003', 'Karan', 'Mehta', 'student3@smartattendance.com', '+91-9876543212', 'Computer Science & Engineering', 3, 'B'),
(4, 7, 'STU-2026-004', 'Sneha', 'Rao', 'student4@smartattendance.com', '+91-9876543213', 'Information Technology', 2, 'A'),
(5, 8, 'STU-2026-005', 'Vikram', 'Singh', 'student5@smartattendance.com', '+91-9876543214', 'Information Technology', 2, 'A');

INSERT INTO courses (id, course_code, course_name, description, credits) VALUES
(1, 'CS301', 'Data Structures & Algorithms', 'In-depth study of algorithms, tree structures, graph algorithms and dynamic programming.', 4),
(2, 'IT204', 'Database Management Systems', 'Relational database design, normal forms, transaction management, indexing and SQL optimization.', 3),
(3, 'CS305', 'Computer Networks & Security', 'OSI layers, TCP/IP protocol suite, network security and routing protocols.', 4);

INSERT INTO classes (id, course_id, teacher_id, class_name, room, schedule_day, start_time, end_time) VALUES
(1, 1, 1, 'CS301 - Section A', 'Room 304 - Tech Block', 'Monday', '09:00:00', '10:30:00'),
(2, 2, 2, 'IT204 - Section A', 'Room 201 - IT Wing', 'Wednesday', '11:00:00', '12:30:00');

INSERT INTO enrollments (student_id, class_id) VALUES
(1, 1), (2, 1), (3, 1), (1, 2), (2, 2), (4, 2), (5, 2);

INSERT INTO locations (id, name, latitude, longitude, default_radius, description) VALUES
(1, 'Tech Block - Room 304', 12.9715987, 77.5945627, 50.0, 'Computer Science Main Laboratory & Lecture Hall'),
(2, 'IT Wing - Room 201', 12.9720000, 77.5950000, 45.0, 'Information Technology Seminar Room'),
(3, 'Central Campus Auditorium', 12.9710000, 77.5940000, 100.0, 'Main Institutional Auditorium');

INSERT INTO attendance_sessions (id, class_id, teacher_id, session_date, start_time, end_time, latitude, longitude, allowed_radius, status) VALUES
(1, 1, 1, CURDATE(), '09:00:00', '10:30:00', 12.9715987, 77.5945627, 60.0, 'ACTIVE');

INSERT INTO attendance (session_id, student_id, attendance_time, latitude, longitude, distance_from_class, status, remarks) VALUES
(1, 1, NOW(), 12.9715990, 77.5945630, 0.42, 'PRESENT', 'On time - verified inside geofence radius'),
(1, 2, NOW(), 12.9716500, 77.5946000, 7.15, 'PRESENT', 'On time - verified inside geofence radius');
