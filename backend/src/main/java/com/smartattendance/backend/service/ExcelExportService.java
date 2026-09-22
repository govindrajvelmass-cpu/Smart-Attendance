package com.smartattendance.backend.service;

import com.smartattendance.backend.entity.Attendance;
import com.smartattendance.backend.entity.AttendanceSession;
import com.smartattendance.backend.entity.Enrollment;
import com.smartattendance.backend.entity.Student;
import com.smartattendance.backend.repository.AttendanceRepository;
import com.smartattendance.backend.repository.AttendanceSessionRepository;
import com.smartattendance.backend.repository.EnrollmentRepository;
import com.smartattendance.backend.repository.StudentRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ExcelExportService {

    private final AttendanceRepository attendanceRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;

    private static final String[] HEADERS = {
            "Date",
            "Session ID",
            "Subject",
            "Teacher",
            "Student Name",
            "Roll Number",
            "Student Email",
            "Location Verification",
            "Distance",
            "Face Verification",
            "Attendance Status",
            "Attendance Time"
    };

    private static final String[] STUDENT_TODAY_HEADERS = {
            "Student Name",
            "Roll Number",
            "Email",
            "Subject",
            "Teacher",
            "Session Date",
            "Session Time",
            "Attendance Status",
            "Latitude",
            "Longitude",
            "Location Verified",
            "Face Verified",
            "Marked At"
    };

    public ExcelExportService(AttendanceRepository attendanceRepository,
                              AttendanceSessionRepository sessionRepository,
                              EnrollmentRepository enrollmentRepository,
                              StudentRepository studentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.sessionRepository = sessionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generateSessionAttendanceExcel(Long sessionId) throws IOException {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        List<Enrollment> enrollments = enrollmentRepository.findByClassEntity_Id(session.getClassEntity().getId());
        List<Attendance> attendanceRecords = attendanceRepository.findBySession_Id(sessionId);

        Map<Long, Attendance> attendanceMap = new HashMap<>();
        for (Attendance att : attendanceRecords) {
            attendanceMap.put(att.getStudent().getId(), att);
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendance - Session " + session.getId());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont font = workbook.createFont();
            font.setFontName("Arial");
            font.setFontHeightInPoints((short) 10);
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle presentStyle = workbook.createCellStyle();
            presentStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            presentStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle absentStyle = workbook.createCellStyle();
            absentStyle.setFillForegroundColor(IndexedColors.CORAL.getIndex());
            absentStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle rejectedStyle = workbook.createCellStyle();
            rejectedStyle.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
            rejectedStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < HEADERS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(HEADERS[col]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

            for (Enrollment enrollment : enrollments) {
                Student student = enrollment.getStudent();
                if (student == null) continue;

                Attendance att = attendanceMap.get(student.getId());

                Row row = sheet.createRow(rowIdx);

                String dateStr = session.getSessionDate() != null ? session.getSessionDate().format(dateFormatter) : "-";
                row.createCell(0).setCellValue(dateStr);
                row.createCell(1).setCellValue(session.getId());

                String subject = (session.getClassEntity() != null && session.getClassEntity().getCourse() != null)
                        ? session.getClassEntity().getCourse().getCourseName()
                        : "-";
                row.createCell(2).setCellValue(subject);

                String teacherName = session.getTeacher() != null
                        ? session.getTeacher().getFirstName() + " " + session.getTeacher().getLastName()
                        : "-";
                row.createCell(3).setCellValue(teacherName);
                row.createCell(4).setCellValue(student.getFirstName() + " " + student.getLastName());
                row.createCell(5).setCellValue(student.getStudentNumber());
                row.createCell(6).setCellValue(student.getEmail());

                if (att != null) {
                    String locStatus = att.getLocationStatus() != null ? att.getLocationStatus() : "VERIFIED";
                    row.createCell(7).setCellValue(locStatus);

                    String distStr = att.getDistanceFromClass() != null
                            ? String.format(Locale.US, "%.1f meters", att.getDistanceFromClass())
                            : "0.0 meters";
                    row.createCell(8).setCellValue(distStr);

                    String faceStatus = att.getFaceStatus() != null ? att.getFaceStatus() : "VERIFIED";
                    row.createCell(9).setCellValue(faceStatus);

                    Cell statusCell = row.createCell(10);
                    String statusName = att.getStatus() != null ? att.getStatus().name() : "PRESENT";
                    statusCell.setCellValue(statusName);
                    if ("PRESENT".equalsIgnoreCase(statusName)) {
                        statusCell.setCellStyle(presentStyle);
                    } else {
                        statusCell.setCellStyle(rejectedStyle);
                    }

                    String timeStr = att.getAttendanceTime() != null ? att.getAttendanceTime().format(timeFormatter) : "-";
                    row.createCell(11).setCellValue(timeStr);
                } else {
                    row.createCell(7).setCellValue("NOT_ATTEMPTED");
                    row.createCell(8).setCellValue("-");
                    row.createCell(9).setCellValue("NOT_ATTEMPTED");

                    Cell statusCell = row.createCell(10);
                    statusCell.setCellValue("ABSENT");
                    statusCell.setCellStyle(absentStyle);

                    row.createCell(11).setCellValue("-");
                }

                rowIdx++;
            }

            for (int col = 0; col < HEADERS.length; col++) {
                sheet.autoSizeColumn(col);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateStudentTodayAttendanceExcel(Long studentId) throws IOException {
        Student student = studentRepository.findByUser_Id(studentId)
                .orElse(null);
        if (student == null) {
            student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + studentId));
        }

        LocalDate today = LocalDate.now();
        List<AttendanceSession> sessionsToday = sessionRepository.findBySessionDateOrderByIdDesc(today);
        List<Attendance> attendances = attendanceRepository.findByStudent_Id(student.getId());

        Map<Long, Attendance> attendanceMap = new HashMap<>();
        for (Attendance a : attendances) {
            if (a.getSession() != null) {
                attendanceMap.put(a.getSession().getId(), a);
            }
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Today Attendance - " + student.getStudentNumber());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont font = workbook.createFont();
            font.setFontName("Arial");
            font.setFontHeightInPoints((short) 10);
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle presentStyle = workbook.createCellStyle();
            presentStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            presentStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle notMarkedStyle = workbook.createCellStyle();
            notMarkedStyle.setFillForegroundColor(IndexedColors.CORAL.getIndex());
            notMarkedStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < STUDENT_TODAY_HEADERS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(STUDENT_TODAY_HEADERS[col]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

            for (AttendanceSession session : sessionsToday) {
                boolean enrolled = enrollmentRepository.existsByStudent_IdAndClassEntity_Id(student.getId(), session.getClassEntity().getId());
                if (!enrolled) continue;

                Attendance att = attendanceMap.get(session.getId());
                Row row = sheet.createRow(rowIdx);

                row.createCell(0).setCellValue(student.getFirstName() + " " + student.getLastName());
                row.createCell(1).setCellValue(student.getStudentNumber());
                row.createCell(2).setCellValue(student.getEmail());

                String subject = (session.getClassEntity() != null && session.getClassEntity().getCourse() != null)
                        ? session.getClassEntity().getCourse().getCourseName() : "-";
                row.createCell(3).setCellValue(subject);

                String teacherName = session.getTeacher() != null
                        ? session.getTeacher().getFirstName() + " " + session.getTeacher().getLastName() : "-";
                row.createCell(4).setCellValue(teacherName);

                row.createCell(5).setCellValue(session.getSessionDate() != null ? session.getSessionDate().format(dateFormatter) : "-");
                String sessionTime = (session.getStartTime() != null ? session.getStartTime().toString() : "09:00") + " - " +
                        (session.getEndTime() != null ? session.getEndTime().toString() : "10:00");
                row.createCell(6).setCellValue(sessionTime);

                if (att != null) {
                    Cell statusCell = row.createCell(7);
                    String statusStr = att.getStatus() != null ? att.getStatus().name() : "PRESENT";
                    statusCell.setCellValue(statusStr);
                    statusCell.setCellStyle("PRESENT".equalsIgnoreCase(statusStr) ? presentStyle : notMarkedStyle);

                    row.createCell(8).setCellValue(att.getLatitude() != null ? String.valueOf(att.getLatitude()) : "-");
                    row.createCell(9).setCellValue(att.getLongitude() != null ? String.valueOf(att.getLongitude()) : "-");
                    row.createCell(10).setCellValue(att.getLocationStatus() != null ? att.getLocationStatus() : "VERIFIED");
                    row.createCell(11).setCellValue(att.getFaceStatus() != null ? att.getFaceStatus() : "VERIFIED");
                    row.createCell(12).setCellValue(att.getAttendanceTime() != null ? att.getAttendanceTime().format(timeFormatter) : "-");
                } else {
                    Cell statusCell = row.createCell(7);
                    statusCell.setCellValue("NOT MARKED");
                    statusCell.setCellStyle(notMarkedStyle);

                    row.createCell(8).setCellValue("-");
                    row.createCell(9).setCellValue("-");
                    row.createCell(10).setCellValue("NOT ATTEMPTED");
                    row.createCell(11).setCellValue("NOT ATTEMPTED");
                    row.createCell(12).setCellValue("-");
                }

                rowIdx++;
            }

            for (int col = 0; col < STUDENT_TODAY_HEADERS.length; col++) {
                sheet.autoSizeColumn(col);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
