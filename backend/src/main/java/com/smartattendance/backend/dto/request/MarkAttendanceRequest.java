package com.smartattendance.backend.dto.request;

import jakarta.validation.constraints.NotNull;

public class MarkAttendanceRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    public MarkAttendanceRequest() {
    }

    public MarkAttendanceRequest(Long sessionId, Double latitude, Double longitude) {
        this.sessionId = sessionId;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
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

    private String faceEmbedding;
    private Boolean faceVerified;

    public String getFaceEmbedding() {
        return faceEmbedding;
    }

    public void setFaceEmbedding(String faceEmbedding) {
        this.faceEmbedding = faceEmbedding;
    }

    public Boolean getFaceVerified() {
        return faceVerified;
    }

    public void setFaceVerified(Boolean faceVerified) {
        this.faceVerified = faceVerified;
    }

    private String token;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
