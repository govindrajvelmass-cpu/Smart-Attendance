package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByClassEntity_Id(Long classId);
    List<Enrollment> findByStudent_Id(Long studentId);
    Optional<Enrollment> findByStudent_IdAndClassEntity_Id(Long studentId, Long classId);
    boolean existsByStudent_IdAndClassEntity_Id(Long studentId, Long classId);
    void deleteByStudent_IdAndClassEntity_Id(Long studentId, Long classId);
}
