package com.smartattendance.backend.dto.response;

import com.smartattendance.backend.entity.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class AttendanceRecordResponse {

    private Long id;
    private Long sessionId;
    private Long studentId;
    private String studentNumber;
    private String studentName;
    private String studentEmail;
    private String department;
    private Integer year;
    private Integer semester;
    private String className;
    private String courseCode;
    private LocalDate sessionDate;
    private LocalDateTime attendanceTime;
    private Double latitude;
    private Double longitude;
    private Double distanceFromClass;
    private Double classLatitude;
    private Double classLongitude;
    private Double allowedRadius;
    private String locationStatus;
    private String faceStatus;
    private String teacherVerification;
    private AttendanceStatus status;
    private String remarks;

    public AttendanceRecordResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentNumber() {
        return studentNumber;
    }

    public void setStudentNumber(String studentNumber) {
        this.studentNumber = studentNumber;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public LocalDateTime getAttendanceTime() {
        return attendanceTime;
    }

    public void setAttendanceTime(LocalDateTime attendanceTime) {
        this.attendanceTime = attendanceTime;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getDistanceFromClass() {
        return distanceFromClass;
    }

    public void setDistanceFromClass(Double distanceFromClass) {
        this.distanceFromClass = distanceFromClass;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Double getClassLatitude() {
        return classLatitude;
    }

    public void setClassLatitude(Double classLatitude) {
        this.classLatitude = classLatitude;
    }

    public Double getClassLongitude() {
        return classLongitude;
    }

    public void setClassLongitude(Double classLongitude) {
        this.classLongitude = classLongitude;
    }

    public Double getAllowedRadius() {
        return allowedRadius;
    }

    public void setAllowedRadius(Double allowedRadius) {
        this.allowedRadius = allowedRadius;
    }

    public String getLocationStatus() {
        return locationStatus;
    }

    public void setLocationStatus(String locationStatus) {
        this.locationStatus = locationStatus;
    }

    public String getFaceStatus() {
        return faceStatus;
    }

    public void setFaceStatus(String faceStatus) {
        this.faceStatus = faceStatus;
    }

    public String getTeacherVerification() {
        return teacherVerification;
    }

    public void setTeacherVerification(String teacherVerification) {
        this.teacherVerification = teacherVerification;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }
}
