package com.smartattendance.backend.dto.request;

import com.smartattendance.backend.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateAttendanceRequest {

    @NotNull(message = "Attendance status is required")
    private AttendanceStatus status;

    private String remarks;

    public UpdateAttendanceRequest() {
    }

    public UpdateAttendanceRequest(AttendanceStatus status, String remarks) {
        this.status = status;
        this.remarks = remarks;
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
}
