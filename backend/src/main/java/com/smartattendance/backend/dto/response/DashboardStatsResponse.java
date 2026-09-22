package com.smartattendance.backend.dto.response;

import java.util.List;

public class DashboardStatsResponse {

    // Common/Overview Counts
    private long totalStudents;
    private long totalTeachers;
    private long totalCourses;
    private long totalClasses;
    private long activeSessions;

    // Attendance Metrics
    private long totalAttendanceRecords;
    private long presentCount;
    private long absentCount;
    private long lateCount;
    private double attendancePercentage;

    // Recent Records
    private List<AttendanceRecordResponse> recentAttendance;
    private List<ClassResponse> classes;
    private List<AttendanceSessionResponse> activeSessionsList;

    public DashboardStatsResponse() {
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalTeachers() {
        return totalTeachers;
    }

    public void setTotalTeachers(long totalTeachers) {
        this.totalTeachers = totalTeachers;
    }

    public long getTotalCourses() {
        return totalCourses;
    }

    public void setTotalCourses(long totalCourses) {
        this.totalCourses = totalCourses;
    }

    public long getTotalClasses() {
        return totalClasses;
    }

    public void setTotalClasses(long totalClasses) {
        this.totalClasses = totalClasses;
    }

    public long getActiveSessions() {
        return activeSessions;
    }

    public void setActiveSessions(long activeSessions) {
        this.activeSessions = activeSessions;
    }

    public long getTotalAttendanceRecords() {
        return totalAttendanceRecords;
    }

    public void setTotalAttendanceRecords(long totalAttendanceRecords) {
        this.totalAttendanceRecords = totalAttendanceRecords;
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

    public double getAttendancePercentage() {
        return attendancePercentage;
    }

    public void setAttendancePercentage(double attendancePercentage) {
        this.attendancePercentage = attendancePercentage;
    }

    public List<AttendanceRecordResponse> getRecentAttendance() {
        return recentAttendance;
    }

    public void setRecentAttendance(List<AttendanceRecordResponse> recentAttendance) {
        this.recentAttendance = recentAttendance;
    }

    public List<ClassResponse> getClasses() {
        return classes;
    }

    public void setClasses(List<ClassResponse> classes) {
        this.classes = classes;
    }

    public List<AttendanceSessionResponse> getActiveSessionsList() {
        return activeSessionsList;
    }

    public void setActiveSessionsList(List<AttendanceSessionResponse> activeSessionsList) {
        this.activeSessionsList = activeSessionsList;
    }
}
