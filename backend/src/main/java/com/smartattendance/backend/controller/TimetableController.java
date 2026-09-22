package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.request.ClassDto;
import com.smartattendance.backend.dto.response.AttendanceRecordResponse;
import com.smartattendance.backend.dto.response.AttendanceSessionResponse;
import com.smartattendance.backend.dto.response.ClassResponse;
import com.smartattendance.backend.entity.AttendanceSession;
import com.smartattendance.backend.entity.ClassEntity;
import com.smartattendance.backend.repository.AttendanceSessionRepository;
import com.smartattendance.backend.repository.ClassRepository;
import com.smartattendance.backend.service.AttendanceService;
import com.smartattendance.backend.service.AttendanceSessionService;
import com.smartattendance.backend.service.ClassService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/timetable")
public class TimetableController {

    private final ClassService classService;
    private final ClassRepository classRepository;
    private final AttendanceSessionService sessionService;
    private final AttendanceService attendanceService;
    private final AttendanceSessionRepository sessionRepository;

    private static final List<String> DAY_LIST = List.of(
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    );

    public TimetableController(ClassService classService,
                               ClassRepository classRepository,
                               AttendanceSessionService sessionService,
                               AttendanceService attendanceService,
                               AttendanceSessionRepository sessionRepository) {
        this.classService = classService;
        this.classRepository = classRepository;
        this.sessionService = sessionService;
        this.attendanceService = attendanceService;
        this.sessionRepository = sessionRepository;
    }

    @GetMapping({"", "/weekly"})
    public ResponseEntity<Map<String, ClassResponse>> getWeeklyTimetable() {
        List<ClassResponse> classes = classService.getAllClasses();
        Map<String, ClassResponse> map = new LinkedHashMap<>();

        for (String day : DAY_LIST) {
            classes.stream()
                    .filter(c -> c.getScheduleDay() != null && c.getScheduleDay().equalsIgnoreCase(day))
                    .findFirst()
                    .ifPresent(c -> map.put(day, c));
        }
        return ResponseEntity.ok(map);
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodaySession() {
        DayOfWeek currentDay = LocalDate.now().getDayOfWeek();
        String dayName = currentDay.toString();
        dayName = dayName.substring(0, 1).toUpperCase() + dayName.substring(1).toLowerCase();

        List<ClassEntity> todayClasses = classRepository.findByScheduleDayIgnoreCase(dayName);
        ClassResponse scheduledClass = null;

        if (!todayClasses.isEmpty()) {
            scheduledClass = classService.getClassById(todayClasses.get(0).getId());
        } else {
            List<ClassEntity> all = classRepository.findAll();
            if (!all.isEmpty()) {
                scheduledClass = classService.getClassById(all.get(0).getId());
            }
        }

        // Find active session for today
        List<AttendanceSessionResponse> activeSessions = sessionService.getActiveSessions();
        AttendanceSessionResponse currentSession = null;
        List<AttendanceRecordResponse> records = Collections.emptyList();

        if (!activeSessions.isEmpty()) {
            currentSession = activeSessions.get(0);
            for (AttendanceSessionResponse s : activeSessions) {
                List<AttendanceRecordResponse> recs = attendanceService.getAttendanceBySession(s.getId());
                if (!recs.isEmpty()) {
                    currentSession = s;
                    records = recs;
                    break;
                }
            }
            if (records.isEmpty() && currentSession != null) {
                records = attendanceService.getAttendanceBySession(currentSession.getId());
            }
        } else {
            List<AttendanceSession> sessionsToday = sessionRepository.findBySessionDateOrderByIdDesc(LocalDate.now());
            if (!sessionsToday.isEmpty()) {
                currentSession = sessionService.getSessionById(sessionsToday.get(0).getId());
                for (AttendanceSession s : sessionsToday) {
                    List<AttendanceRecordResponse> recs = attendanceService.getAttendanceBySession(s.getId());
                    if (!recs.isEmpty()) {
                        currentSession = sessionService.getSessionById(s.getId());
                        records = recs;
                        break;
                    }
                }
                if (records.isEmpty() && currentSession != null) {
                    records = attendanceService.getAttendanceBySession(currentSession.getId());
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("todayDay", dayName);
        result.put("scheduledClass", scheduledClass);
        result.put("session", currentSession);
        result.put("records", records);

        return ResponseEntity.ok(result);
    }

    @PostMapping({"", "/classes"})
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ClassResponse> createTimetableEntry(@RequestBody ClassDto dto) {
        ClassResponse created = classService.createClass(dto);
        return ResponseEntity.ok(created);
    }

    @PutMapping({"/{id:\\d+}", "/classes/{id:\\d+}"})
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<ClassResponse> updateTimetableEntry(@PathVariable Long id, @RequestBody ClassDto dto) {
        ClassResponse updated = classService.updateClass(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping({"/{id:\\d+}", "/classes/{id:\\d+}"})
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    public ResponseEntity<Void> deleteTimetableEntry(@PathVariable Long id) {
        classService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }
}
