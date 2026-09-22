package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.PendingStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PendingStudentRepository extends JpaRepository<PendingStudent, Long> {
    Optional<PendingStudent> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<PendingStudent> findByStatusIgnoreCase(String status);
    long countByStatusIgnoreCase(String status);
}
