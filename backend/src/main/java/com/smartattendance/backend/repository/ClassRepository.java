package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    List<ClassEntity> findByTeacher_Id(Long teacherId);
    List<ClassEntity> findByCourse_Id(Long courseId);
    List<ClassEntity> findByScheduleDayIgnoreCase(String scheduleDay);
}
