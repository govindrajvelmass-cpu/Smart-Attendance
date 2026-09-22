package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser_Id(Long userId);
    Optional<Student> findByStudentNumber(String studentNumber);
    Optional<Student> findByEmail(String email);
    Boolean existsByStudentNumber(String studentNumber);
    Boolean existsByEmail(String email);
    List<Student> findByDepartment(String department);
    long countByFaceEnrolledTrue();
    long countByFaceEnrolledFalse();
}
