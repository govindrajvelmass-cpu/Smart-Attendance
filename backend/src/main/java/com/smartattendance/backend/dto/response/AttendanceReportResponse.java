package com.smartattendance.backend.dto.response;

import java.util.List;

public class AttendanceReportResponse {

    private long totalSessions;
    private long totalRecords;
    private long presentCount;
    private long absentCount;
    private long lateCount;
    private long excusedCount;
    private double attendancePercentage;
    private List<AttendanceRecordResponse> records;

    public AttendanceReportResponse() {
    }

    public long getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(long totalSessions) {
        this.totalSessions = totalSessions;
    }

    public long getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(long totalRecords) {
        this.totalRecords = totalRecords;
    }

    public long getPresentCount() {
        return presentCount;
    }

    public void setPresentCount(long presentCount) {
        this.presentCount = presentCount;
    }

    public long getAbsentCount() {
        return absentCount;
    }

    public void setAbsentCount(long absentCount) {
        this.absentCount = absentCount;
    }

    public long getLateCount() {
        return lateCount;
    }

    public void setLateCount(long lateCount) {
        this.lateCount = lateCount;
    }

    public long getExcusedCount() {
        return excusedCount;
    }

    public void setExcusedCount(long excusedCount) {
        this.excusedCount = excusedCount;
    }

    public double getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(double attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }

    public List<AttendanceRecordResponse> getRecords() {
        return records;
    }

    public void setRecords(List<AttendanceRecordResponse> records) {
        this.records = records;
    }
}
