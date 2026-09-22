package com.smartattendance.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartattendance.backend.dto.request.AttendanceSessionRequest;
import com.smartattendance.backend.dto.request.CourseDto;
import com.smartattendance.backend.dto.request.LoginRequest;
import com.smartattendance.backend.dto.request.MarkAttendanceRequest;
import com.smartattendance.backend.dto.request.StudentDto;
import com.smartattendance.backend.dto.response.AttendanceSessionResponse;
import com.smartattendance.backend.dto.response.AuthResponse;
import com.smartattendance.backend.dto.response.StudentResponse;
import com.smartattendance.backend.entity.ClassEntity;
import com.smartattendance.backend.repository.ClassRepository;
import com.smartattendance.backend.service.AttendanceSessionService;
import com.smartattendance.backend.service.StudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.smartattendance.backend.security.JwtTokenProvider;

@SpringBootTest
public class AttendanceIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private StudentService studentService;

    @Autowired
    private AttendanceSessionService sessionService;

    @Autowired
    private ClassRepository classRepository;

    private MockMvc mockMvc;

    @BeforeEach
    public void setup() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private String getAuthToken(String usernameOrEmail, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(usernameOrEmail, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                result.getResponse().getContentAsString(), AuthResponse.class
        );
        return authResponse.getAccessToken();
    }

    private StudentResponse ensureTestStudent(String rollNo, String email) {
        return studentService.getAllStudents().stream()
                .filter(s -> s.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElseGet(() -> {
                    StudentDto dto = new StudentDto();
                    dto.setStudentNumber(rollNo);
                    dto.setFirstName("Test");
                    dto.setLastName("Student");
                    dto.setEmail(email);
                    dto.setDepartment("Computer Science");
                    dto.setPhone("9876543210");
                    dto.setYear(1);
                    dto.setSection("A");
                    return studentService.createStudent(dto);
                });
    }

    @Test
    void testHodLoginSuccess() throws Exception {
        String token = getAuthToken("hod@smartattendance.local", "Hod@123");
        assertNotNull(token);
    }

    @Test
    void testTeacherLoginSuccess() throws Exception {
        String token = getAuthToken("teacher@smartattendance.local", "Teacher@123");
        assertNotNull(token);
    }

    @Test
    void testInvalidLoginFails() throws Exception {
        LoginRequest loginRequest = new LoginRequest("hod@smartattendance.local", "WrongPassword");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRoleAuthorizationStudentCannotCreateCourse() throws Exception {
        ensureTestStudent("STU101", "teststudent101@gmail.com");
        String studentToken = getAuthToken("teststudent101@gmail.com", "Student@123");

        CourseDto newCourse = new CourseDto();
        newCourse.setCourseCode("CS999");
        newCourse.setCourseName("Advanced AI Robotics");
        newCourse.setDescription("Robotics course");
        newCourse.setCredits(4);

        mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newCourse)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAttendanceLocationRadiusRejection() throws Exception {
        StudentResponse student = ensureTestStudent("STU102", "teststudent102@gmail.com");
        ClassEntity classEntity = classRepository.findAll().get(0);

        AttendanceSessionRequest sessionReq = new AttendanceSessionRequest();
        sessionReq.setClassId(classEntity.getId());
        sessionReq.setSessionDate(LocalDate.now());
        sessionReq.setStartTime(LocalTime.now());
        sessionReq.setEndTime(LocalTime.now().plusHours(1));
        sessionReq.setLatitude(13.0000);
        sessionReq.setLongitude(77.6000);
        sessionReq.setAllowedRadius(50.0);

        AttendanceSessionResponse session = sessionService.createSession(sessionReq, null);
        assertNotNull(session);

        String studentToken = getAuthToken("teststudent102@gmail.com", "Student@123");

        // Attempt attendance from far away (approx 5 km away)
        MarkAttendanceRequest farRequest = new MarkAttendanceRequest(session.getId(), 13.0500, 77.6500);

        mockMvc.perform(post("/api/attendance/mark")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farRequest)))
                .andExpect(status().isBadRequest());
    }

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void testAttendanceTokenVerificationAndTodayExport() throws Exception {
        StudentResponse student = ensureTestStudent("STU103", "teststudent103@gmail.com");
        ClassEntity classEntity = classRepository.findAll().get(0);

        AttendanceSessionRequest sessionReq = new AttendanceSessionRequest();
        sessionReq.setClassId(classEntity.getId());
        sessionReq.setSessionDate(LocalDate.now());
        sessionReq.setStartTime(LocalTime.now().minusMinutes(5));
        sessionReq.setEndTime(LocalTime.now().plusHours(1));
        sessionReq.setLatitude(12.9716);
        sessionReq.setLongitude(77.5946);
        sessionReq.setAllowedRadius(50.0);

        AttendanceSessionResponse session = sessionService.createSession(sessionReq, null);
        assertNotNull(session);

        // Generate invitation token
        String attToken = jwtTokenProvider.generateAttendanceToken(student.getId(), session.getId(), student.getEmail(), 3600000L);
        assertNotNull(attToken);

        // Verify token via public endpoint
        mockMvc.perform(get("/api/attendance/token/" + attToken))
                .andExpect(status().isOk());

        // Verify student today sessions and export
        String studentAuthToken = getAuthToken("teststudent103@gmail.com", "Student@123");
        mockMvc.perform(get("/api/attendance/student/today")
                        .header("Authorization", "Bearer " + studentAuthToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/attendance/student/today/export-excel")
                        .header("Authorization", "Bearer " + studentAuthToken))
                .andExpect(status().isOk());
    }
}
