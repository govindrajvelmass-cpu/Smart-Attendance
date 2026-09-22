package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.AttendanceSession;
import com.smartattendance.backend.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByClassEntity_Id(Long classId);
    List<AttendanceSession> findByTeacher_Id(Long teacherId);
    List<AttendanceSession> findByStatus(SessionStatus status);
    List<AttendanceSession> findByStatusOrderByIdDesc(SessionStatus status);
    List<AttendanceSession> findBySessionDate(LocalDate date);
    List<AttendanceSession> findBySessionDateOrderByIdDesc(LocalDate date);
    List<AttendanceSession> findByClassEntity_IdAndSessionDate(Long classId, LocalDate date);
}
