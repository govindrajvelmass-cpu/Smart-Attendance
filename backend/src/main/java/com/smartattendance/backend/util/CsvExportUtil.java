package com.smartattendance.backend.util;

import com.smartattendance.backend.dto.response.AttendanceRecordResponse;

import java.nio.charset.StandardCharsets;
import java.util.List;

public final class CsvExportUtil {

    private CsvExportUtil() {
    }

    public static byte[] generateAttendanceCsv(List<AttendanceRecordResponse> records) {
        StringBuilder sb = new StringBuilder();
        // CSV Header
        sb.append("Record ID,Student Number,Student Name,Email,Class Name,Course Code,Session Date,Attendance Time,Distance (m),Status,Remarks\n");

        if (records != null) {
            for (AttendanceRecordResponse r : records) {
                sb.append(escapeSpecialCharacters(r.getId() != null ? r.getId().toString() : "")).append(",");
                sb.append(escapeSpecialCharacters(r.getStudentNumber())).append(",");
                sb.append(escapeSpecialCharacters(r.getStudentName())).append(",");
                sb.append(escapeSpecialCharacters(r.getStudentEmail())).append(",");
                sb.append(escapeSpecialCharacters(r.getClassName())).append(",");
                sb.append(escapeSpecialCharacters(r.getCourseCode())).append(",");
                sb.append(escapeSpecialCharacters(r.getSessionDate() != null ? r.getSessionDate().toString() : "")).append(",");
                sb.append(escapeSpecialCharacters(r.getAttendanceTime() != null ? r.getAttendanceTime().toString() : "")).append(",");
                sb.append(r.getDistanceFromClass() != null ? String.format("%.2f", r.getDistanceFromClass()) : "0.00").append(",");
                sb.append(escapeSpecialCharacters(r.getStatus() != null ? r.getStatus().name() : "")).append(",");
                sb.append(escapeSpecialCharacters(r.getRemarks())).append("\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String escapeSpecialCharacters(String data) {
        if (data == null) {
            return "";
        }
        String escapedData = data.replaceAll("\\R", " ");
        if (data.contains(",") || data.contains("\"") || data.contains("'")) {
            data = data.replace("\"", "\"\"");
            escapedData = "\"" + data + "\"";
        }
        return escapedData;
    }
}
