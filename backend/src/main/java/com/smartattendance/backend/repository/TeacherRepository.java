package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUser_Id(Long userId);
    Optional<Teacher> findByEmployeeNumber(String employeeNumber);
    Optional<Teacher> findByEmail(String email);
    Boolean existsByEmployeeNumber(String employeeNumber);
    Boolean existsByEmail(String email);
}
