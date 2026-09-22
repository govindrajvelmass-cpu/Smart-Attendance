package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.request.LoginRequest;
import com.smartattendance.backend.dto.request.RefreshTokenRequest;
import com.smartattendance.backend.dto.request.RegisterRequest;
import com.smartattendance.backend.dto.response.AuthResponse;
import com.smartattendance.backend.dto.response.UserSummaryDto;
import com.smartattendance.backend.entity.*;
import com.smartattendance.backend.exception.BadRequestException;
import com.smartattendance.backend.exception.ConflictException;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.exception.UnauthorizedException;
import com.smartattendance.backend.repository.ClassRepository;
import com.smartattendance.backend.repository.EnrollmentRepository;
import com.smartattendance.backend.repository.RefreshTokenRepository;
import com.smartattendance.backend.repository.StudentRepository;
import com.smartattendance.backend.repository.TeacherRepository;
import com.smartattendance.backend.repository.UserRepository;
import com.smartattendance.backend.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       TeacherRepository teacherRepository,
                       StudentRepository studentRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       ClassRepository classRepository,
                       EnrollmentRepository enrollmentRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Allow login by either email or username
        String username = request.getUsernameOrEmail();
        Optional<User> userOpt = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username));

        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("Invalid username, email, or password");
        }

        User user = userOpt.get();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        // Remove old tokens and generate new Refresh Token
        refreshTokenRepository.deleteByUser_Id(user.getId());
        RefreshToken refreshToken = createRefreshToken(user);

        UserSummaryDto userSummary = buildUserSummary(user);
        return new AuthResponse(jwt, refreshToken.getToken(), userSummary);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username is already taken: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered: " + request.getEmail());
        }

        if (request.getRole() == Role.STUDENT && studentRepository.count() >= 20) {
            throw new BadRequestException("Maximum prototype capacity reached (20 students). Cannot register more students.");
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole()
        );
        user = userRepository.save(user);

        if (request.getRole() == Role.TEACHER) {
            String empNo = request.getIdentifier() != null && !request.getIdentifier().isBlank()
                    ? request.getIdentifier()
                    : "EMP-" + System.currentTimeMillis() % 10000;

            Teacher teacher = new Teacher(
                    user,
                    empNo,
                    request.getFirstName(),
                    request.getLastName(),
                    request.getEmail(),
                    request.getDepartment() != null ? request.getDepartment() : "General"
            );
            teacherRepository.save(teacher);
        } else if (request.getRole() == Role.STUDENT) {
            String stuNo = request.getIdentifier() != null && !request.getIdentifier().isBlank()
                    ? request.getIdentifier()
                    : "STU-" + System.currentTimeMillis() % 10000;

            Student student = new Student(
                    user,
                    stuNo,
                    request.getFirstName(),
                    request.getLastName(),
                    request.getEmail(),
                    request.getPhone(),
                    request.getDepartment() != null ? request.getDepartment() : "General",
                    request.getYear() != null ? request.getYear() : 1,
                    request.getSection() != null ? request.getSection() : "A"
            );
            student = studentRepository.save(student);

            // Auto-enroll student into all master classes
            java.util.List<ClassEntity> allClasses = classRepository.findAll();
            for (ClassEntity cls : allClasses) {
                if (!enrollmentRepository.existsByStudent_IdAndClassEntity_Id(student.getId(), cls.getId())) {
                    enrollmentRepository.save(new Enrollment(student, cls));
                }
            }
        }

        // Auto login upon registration
        String jwt = tokenProvider.generateTokenFromUsername(
                user.getUsername(), user.getId(), user.getEmail(), user.getRole().name()
        );

        RefreshToken refreshToken = createRefreshToken(user);
        UserSummaryDto userSummary = buildUserSummary(user);

        return new AuthResponse(jwt, refreshToken.getToken(), userSummary);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new UnauthorizedException("Refresh token has expired. Please login again.");
        }

        User user = token.getUser();
        String newJwt = tokenProvider.generateTokenFromUsername(
                user.getUsername(), user.getId(), user.getEmail(), user.getRole().name()
        );

        UserSummaryDto userSummary = buildUserSummary(user);
        return new AuthResponse(newJwt, token.getToken(), userSummary);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUser_Id(userId);
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return buildUserSummary(user);
    }

    private RefreshToken createRefreshToken(User user) {
        Instant expiryDate = Instant.now().plusMillis(tokenProvider.getJwtRefreshExpirationMs());
        RefreshToken refreshToken = new RefreshToken(user, UUID.randomUUID().toString(), expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }

    public UserSummaryDto buildUserSummary(User user) {
        String name = user.getUsername();
        String identifier = null;
        Long profileId = null;

        if (user.getRole() == Role.STUDENT) {
            Optional<Student> studentOpt = studentRepository.findByUser_Id(user.getId());
            if (studentOpt.isPresent()) {
                Student s = studentOpt.get();
                name = s.getFirstName() + " " + s.getLastName();
                identifier = s.getStudentNumber();
                profileId = s.getId();
            }
        } else if (user.getRole() == Role.TEACHER) {
            Optional<Teacher> teacherOpt = teacherRepository.findByUser_Id(user.getId());
            if (teacherOpt.isPresent()) {
                Teacher t = teacherOpt.get();
                name = t.getFirstName() + " " + t.getLastName();
                identifier = t.getEmployeeNumber();
                profileId = t.getId();
            }
        } else {
            name = "Head of Department (HOD)";
            identifier = "HOD";
            profileId = user.getId();
        }

        return new UserSummaryDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), name, identifier, profileId);
    }
}
