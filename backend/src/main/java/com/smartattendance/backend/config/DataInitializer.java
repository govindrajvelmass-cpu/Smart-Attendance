package com.smartattendance.backend.config;

import com.smartattendance.backend.entity.*;
import com.smartattendance.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LocationRepository locationRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           TeacherRepository teacherRepository,
                           StudentRepository studentRepository,
                           CourseRepository courseRepository,
                           ClassRepository classRepository,
                           EnrollmentRepository enrollmentRepository,
                           LocationRepository locationRepository,
                           AttendanceSessionRepository sessionRepository,
                           AttendanceRepository attendanceRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.locationRepository = locationRepository;
        this.sessionRepository = sessionRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        boolean hodExists = userRepository.findByEmail("hod@smartattendance.local").isPresent();
        boolean teacherExists = userRepository.findByEmail("teacher@smartattendance.local").isPresent();

        // If old demo students exist (e.g. student01 or auto-seeded students), perform clean initial reset
        boolean hasOldDemoStudents = userRepository.findByUsername("student01").isPresent();

        if (hodExists && teacherExists && !hasOldDemoStudents) {
            log.info("System initialized with HOD and Teacher accounts. Student count: {}. Skipping seed.", studentRepository.count());
            return;
        }

        log.info("Performing clean initial system setup: 1 HOD, 1 Teacher, 0 Students, 0 Sessions, 0 Attendance...");

        // Clean any old tables in safe referential order
        attendanceRepository.deleteAll();
        sessionRepository.deleteAll();
        enrollmentRepository.deleteAll();
        classRepository.deleteAll();
        courseRepository.deleteAll();
        studentRepository.deleteAll();
        teacherRepository.deleteAll();
        locationRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Exactly 1 HOD
        User hodUser = new User(
                "hod",
                "hod@smartattendance.local",
                passwordEncoder.encode("Hod@123"),
                Role.HOD
        );
        userRepository.save(hodUser);

        // 2. Exactly 1 Teacher
        User teacherUser = new User(
                "teacher",
                "teacher@smartattendance.local",
                passwordEncoder.encode("Teacher@123"),
                Role.TEACHER
        );
        userRepository.save(teacherUser);
        Teacher teacher = new Teacher(
                teacherUser,
                "EMP001",
                "Teacher",
                "Demo",
                "teacher@smartattendance.local",
                "Computer Science"
        );
        teacher = teacherRepository.save(teacher);

        // 3. Master Courses (6 Subjects for timetable & session selection)
        Course cMath = courseRepository.save(new Course("MATH101", "Mathematics", "Engineering Mathematics & Calculus", 4));
        Course cPhys = courseRepository.save(new Course("PHY101", "Physics", "Applied Physics & Mechanics", 4));
        Course cJava = courseRepository.save(new Course("CS101", "Java Programming", "Object-Oriented Programming with Java", 4));
        Course cDb = courseRepository.save(new Course("CS102", "Database Management", "Relational Database Management Systems & SQL", 3));
        Course cWeb = courseRepository.save(new Course("CS103", "Web Development", "Modern Full-Stack Web Development", 3));
        Course cProj = courseRepository.save(new Course("CS104", "Capstone Project", "Design & Implementation Capstone Project", 3));

        // 4. Classes (for timetable schedule reference & session assignment)
        ClassEntity clMath = classRepository.save(new ClassEntity(cMath, teacher, "MATH101 - Mathematics", "Room 101", "Monday", LocalTime.of(9, 0), LocalTime.of(10, 0)));
        ClassEntity clPhys = classRepository.save(new ClassEntity(cPhys, teacher, "PHY101 - Physics", "Room 101", "Tuesday", LocalTime.of(9, 0), LocalTime.of(10, 0)));
        ClassEntity clJava = classRepository.save(new ClassEntity(cJava, teacher, "CS101 - Java Programming", "Room 101", "Wednesday", LocalTime.of(9, 0), LocalTime.of(10, 0)));
        ClassEntity clDb = classRepository.save(new ClassEntity(cDb, teacher, "CS102 - Database Management", "Room 101", "Thursday", LocalTime.of(9, 0), LocalTime.of(10, 0)));
        ClassEntity clWeb = classRepository.save(new ClassEntity(cWeb, teacher, "CS103 - Web Development", "Room 101", "Friday", LocalTime.of(9, 0), LocalTime.of(10, 0)));
        ClassEntity clProj = classRepository.save(new ClassEntity(cProj, teacher, "CS104 - Capstone Project", "Room 101", "Saturday", LocalTime.of(9, 0), LocalTime.of(10, 0)));

        // 5. Pre-seed primary student for email verification workflows
        String studentEmail = DotenvLoader.getProperty("MAIL_USERNAME", "24csa34@karpagamtech.ac.in");
        if (studentEmail == null || studentEmail.isBlank()) {
            studentEmail = "24csa34@karpagamtech.ac.in";
        }
        User studentUser = new User(
                "student",
                studentEmail,
                passwordEncoder.encode("Student@123"),
                Role.STUDENT
        );
        studentUser = userRepository.save(studentUser);

        Student student = new Student(
                studentUser,
                "STU001",
                "Student",
                "User",
                studentEmail,
                "9876543210",
                "Computer Science & Engineering",
                1,
                "A"
        );
        student.setFaceEnrolled(true);
        student.setFaceEmbedding("0.15,0.32,0.85,0.41,0.67,0.19,0.55,0.72,0.88,0.23,0.45,0.61,0.79,0.33,0.51,0.92");
        student = studentRepository.save(student);

        // Auto-enroll student into all classes
        enrollmentRepository.save(new Enrollment(student, clMath));
        enrollmentRepository.save(new Enrollment(student, clPhys));
        enrollmentRepository.save(new Enrollment(student, clJava));
        enrollmentRepository.save(new Enrollment(student, clDb));
        enrollmentRepository.save(new Enrollment(student, clWeb));
        enrollmentRepository.save(new Enrollment(student, clProj));

        // 6. Pre-seed an active session so student email links always have a valid session to mark
        AttendanceSession initialSession = new AttendanceSession(
                clMath,
                teacher,
                java.time.LocalDate.now(),
                LocalTime.of(8, 0),
                LocalTime.of(23, 59),
                12.9715987,
                77.5945627,
                100.0,
                SessionStatus.ACTIVE
        );
        initialSession.setEmailStatus("SENT");
        sessionRepository.save(initialSession);

        log.info("System setup complete: 1 HOD, 1 Teacher, 1 Enrolled Student ({}), 1 Active Session.", studentEmail);
    }
}
