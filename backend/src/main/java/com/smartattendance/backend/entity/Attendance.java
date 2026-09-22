package com.smartattendance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(name = "uk_session_student", columnNames = {"session_id", "student_id"})
})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "attendance_time", nullable = false)
    private LocalDateTime attendanceTime;

    private Double latitude;

    private Double longitude;

    @Column(name = "distance_from_class")
    private Double distanceFromClass;

    @Column(name = "class_latitude")
    private Double classLatitude;

    @Column(name = "class_longitude")
    private Double classLongitude;

    @Column(name = "allowed_radius")
    private Double allowedRadius;

    @Column(name = "location_status", length = 20)
    private String locationStatus;

    @Column(name = "face_status", length = 20)
    private String faceStatus;

    @Column(name = "teacher_verification", length = 20)
    private String teacherVerification = "PENDING";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    @Column(length = 255)
    private String remarks;

    public Attendance() {
    }

    public Attendance(AttendanceSession session, Student student, LocalDateTime attendanceTime, Double latitude, Double longitude, Double distanceFromClass, AttendanceStatus status, String remarks) {
        this.session = session;
        this.student = student;
        this.attendanceTime = attendanceTime != null ? attendanceTime : LocalDateTime.now();
        this.latitude = latitude;
        this.longitude = longitude;
        this.distanceFromClass = distanceFromClass;
        this.status = status != null ? status : AttendanceStatus.PRESENT;
        this.remarks = remarks;
    }

    @PrePersist
    protected void onCreate() {
        if (this.attendanceTime == null) {
            this.attendanceTime = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AttendanceSession getSession() {
        return session;
    }

    public void setSession(AttendanceSession session) {
        this.session = session;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
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
}
