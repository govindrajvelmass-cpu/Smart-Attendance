package com.smartattendance.backend.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartattendance.backend.dto.response.AttendanceRecordResponse;
import com.smartattendance.backend.dto.response.AttendanceReportResponse;
import com.smartattendance.backend.entity.Attendance;
import com.smartattendance.backend.entity.AttendanceStatus;
import com.smartattendance.backend.exception.BadRequestException;
import com.smartattendance.backend.repository.AttendanceRepository;
import com.smartattendance.backend.util.CsvExportUtil;

@Service
public class ReportService {

    private final AttendanceRepository attendanceRepository;
    private final AttendanceService attendanceService;

    public ReportService(AttendanceRepository attendanceRepository,
                         AttendanceService attendanceService) {
        this.attendanceRepository = attendanceRepository;
        this.attendanceService = attendanceService;
    }

    @Transactional(readOnly = true)
    public AttendanceReportResponse getAttendanceReport(Long studentId, Long classId, LocalDate startDate, LocalDate endDate, AttendanceStatus status) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Start date cannot be after end date");
        }

        List<Attendance> list = attendanceRepository.findAll();

        if (studentId != null) {
            list = list.stream().filter(a -> a.getStudent() != null && a.getStudent().getId().equals(studentId)).collect(Collectors.toList());
        }

        if (classId != null) {
            list = list.stream().filter(a -> a.getSession() != null && a.getSession().getClassEntity() != null && a.getSession().getClassEntity().getId().equals(classId)).collect(Collectors.toList());
        }

        if (startDate != null) {
            list = list.stream().filter(a -> a.getSession() != null && !a.getSession().getSessionDate().isBefore(startDate)).collect(Collectors.toList());
        }

        if (endDate != null) {
            list = list.stream().filter(a -> a.getSession() != null && !a.getSession().getSessionDate().isAfter(endDate)).collect(Collectors.toList());
        }

        if (status != null) {
            list = list.stream().filter(a -> a.getStatus() == status).collect(Collectors.toList());
        }

        List<AttendanceRecordResponse> records = list.stream()
                .map(attendanceService::mapToResponse)
                .collect(Collectors.toList());

        AttendanceReportResponse report = new AttendanceReportResponse();
        report.setTotalRecords(records.size());
        Set<Long> sessionIds = list.stream()
            .map(Attendance::getSession)
            .filter(session -> session != null && session.getId() != null)
            .map(session -> session.getId())
            .collect(Collectors.toCollection(HashSet::new));
        report.setTotalSessions(sessionIds.size());

        long present = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long absent = records.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
        long late = records.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
        long excused = records.stream().filter(r -> r.getStatus() == AttendanceStatus.EXCUSED).count();

        report.setPresentCount(present);
        report.setAbsentCount(absent);
        report.setLateCount(late);
        report.setExcusedCount(excused);

        double pct = !records.isEmpty() ? ((double) (present + late) / records.size()) * 100.0 : 0.0;
        report.setAttendancePercentage(Math.round(pct * 10.0) / 10.0);
        report.setRecords(records);

        return report;
    }

    @Transactional(readOnly = true)
    public byte[] exportAttendanceCsv(Long studentId, Long classId, LocalDate startDate, LocalDate endDate, AttendanceStatus status) {
        AttendanceReportResponse report = getAttendanceReport(studentId, classId, startDate, endDate, status);
        return CsvExportUtil.generateAttendanceCsv(report.getRecords());
    }
}
