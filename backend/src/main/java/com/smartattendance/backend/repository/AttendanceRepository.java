package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.Attendance;
import com.smartattendance.backend.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findBySession_Id(Long sessionId);
    List<Attendance> findByStudent_Id(Long studentId);
    Optional<Attendance> findBySession_IdAndStudent_Id(Long sessionId, Long studentId);
    boolean existsBySession_IdAndStudent_Id(Long sessionId, Long studentId);
    long countBySession_IdAndStatus(Long sessionId, AttendanceStatus status);
    long countByStudent_IdAndStatus(Long studentId, AttendanceStatus status);
    long countByStudent_Id(Long studentId);
    long countByStatus(AttendanceStatus status);

    @Query("SELECT a FROM Attendance a WHERE a.session.classEntity.id = :classId")
    List<Attendance> findByClassId(@Param("classId") Long classId);

    @Query("SELECT a FROM Attendance a WHERE a.session.sessionDate = :date")
    List<Attendance> findByDate(@Param("date") LocalDate date);

    @Query("SELECT a FROM Attendance a WHERE a.student.id = :studentId ORDER BY a.attendanceTime DESC")
    List<Attendance> findRecentByStudentId(@Param("studentId") Long studentId);
}
