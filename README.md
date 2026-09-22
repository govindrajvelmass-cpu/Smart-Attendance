# Smart Attendance Management System

A full-stack, production-grade web application with role-based access control (Admin, Faculty/Teacher, Student), GPS geofencing with Haversine distance verification, and an AI facial recognition verification interface.

---

## System Architecture

```
Smart_Attendance/
├── backend/                  # Spring Boot 4.1.1, Java 25, Maven, JPA, Security
│   ├── pom.xml
│   ├── database/schema.sql   # SQL DDL & Seed Data
│   └── src/
│       ├── main/java/com/smartattendance/backend/
│       │   ├── config/       # SecurityConfig, CorsConfig, DataInitializer
│       │   ├── controller/   # REST Controllers (Auth, Student, Teacher, Course, Class, Session, Attendance, Reports, Locations)
│       │   ├── dto/          # Request & Response DTOs
│       │   ├── entity/       # JPA Entities (User, Student, Teacher, Course, ClassEntity, AttendanceSession, Attendance, Location...)
│       │   ├── exception/    # GlobalExceptionHandler, Custom Exceptions
│       │   ├── repository/   # Spring Data JPA Repositories
│       │   ├── security/     # JWT Token Provider, Auth Filter, UserPrincipal
│       │   ├── service/      # Business Logic Services
│       │   └── util/         # GeoUtils (Haversine formula), CsvExportUtil
│       └── test/             # JUnit 5 & MockMvc Integration Tests
├── frontend/                 # React 18, Vite, React Router, Lucide Icons
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── components/       # Reusable UI (Navbar, Sidebar, Modal, StatusBadge, CameraPreview, LocationChecker)
│       ├── context/          # AuthContext, ToastContext
│       ├── hooks/            # useAuth, useCamera, useGeolocation
│       ├── layouts/          # DashboardLayout (responsive sidebar & topbar)
│       ├── pages/            # Admin, Teacher, Student, Reports, Profile, Auth
│       ├── services/         # Axios API client with JWT & refresh token interceptors
│       ├── styles/           # Modern custom CSS design system
│       └── utils/            # Geo and Date formatting utilities
└── database/                 # Standalone SQL schema scripts
    ├── smart_attendance.sql
    └── README.md
```

---

## Technology Stack

- **Backend:** Java 25, Spring Boot 4.1.1, Maven 3.9+, Spring Data JPA, Spring Security, JJWT (0.12.6)
- **Database:** MySQL 8.0+ (InnoDB, UTF8mb4)
- **Frontend:** React 18, Vite, React Router v6, Axios, Lucide React icons
- **Security:** Stateless JWT authentication (Bearer tokens), BCrypt password hashing, role-based authorization (`ROLE_ADMIN`, `ROLE_TEACHER`, `ROLE_STUDENT`)
- **Geolocation:** Spherical Earth Haversine formula calculation executed server-side to validate student proximity to classroom coordinates
- **Biometrics:** HTML5 Canvas & WebRTC Camera integration module prepared for facial verification

---

## Default Seed User Credentials

When the backend starts up, `DataInitializer` automatically verifies and provisions default test accounts:

| Role | Email | Password | Full Name | Notes |
|---|---|---|---|---|
| **Admin** | `admin@smartattendance.com` | `Admin@123` | System Administrator | Full access to users, courses, classes, reports, geofences |
| **Faculty** | `teacher1@smartattendance.com` | `Teacher@123` | Dr. Alan Turing | CS Department; manages sessions and class rosters |
| **Faculty** | `teacher2@smartattendance.com` | `Teacher@123` | Dr. Grace Hopper | IT Department |
| **Student** | `student1@smartattendance.com` | `Student@123` | John Doe | Roll No: `CS2026001` (Enrolled in active session) |
| **Student** | `student2@smartattendance.com` | `Student@123` | Jane Smith | Roll No: `CS2026002` |
| **Student** | `student3@smartattendance.com` | `Student@123` | Bob Johnson | Roll No: `CS2026003` |

---

## Prerequisites & Installation

1. **Java Development Kit:** Java 25 installed (`java -version`).
2. **Apache Maven:** Maven 3.9+ installed (`mvn -version`).
3. **Node.js & npm:** Node.js 18+ installed (`node -v`).
4. **MySQL Server:** MySQL 8.0+ installed and running on port `3306`.

---

## Step 1: Database Setup via MySQL Workbench

1. Open **MySQL Workbench** and connect to your local MySQL instance (`localhost:3306`).
2. Open the SQL file:
   ```
   C:\Users\GOVINDARAJ\OneDrive\Desktop\Smart_Attendance\database\smart_attendance.sql
   ```
3. Click the **Execute (Lightning icon)** button to create the database schema and sample records.
4. Verify the database:
   ```sql
   USE smart_attendance;
   SHOW TABLES;
   SELECT * FROM users;
   ```

Alternatively, Spring Boot's JPA will create tables automatically on start if `spring.jpa.hibernate.ddl-auto=update` is enabled.

---

## Step 2: Backend Configuration & Startup

1. Open `backend/src/main/resources/application.properties` (or copy `.env.example` to `.env`):
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/smart_attendance?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```
2. Navigate to the backend directory and run:
   ```powershell
   cd backend
   mvn clean spring-boot:run
   ```
3. To run the automated JUnit test suite:
   ```powershell
   mvn clean test
   ```
4. The backend server will be live at:
   ```
   http://localhost:8080
   ```

---

## Step 3: Frontend Setup & Startup

1. Open a new terminal in the `frontend` directory:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
2. The frontend web portal will launch at:
   ```
   http://localhost:5173
   ```
3. To build the frontend for production:
   ```powershell
   npm run build
   ```

---

## REST API Documentation

### Authentication & Profiles (`/api/auth`)
- `POST /api/auth/login` - Authenticate user, returns JWT and Refresh token.
- `POST /api/auth/register` - Self-registration for new students.
- `POST /api/auth/refresh` - Exchange refresh token for a new JWT.
- `GET  /api/auth/me` - Fetch currently authenticated user profile.
- `PUT  /api/auth/profile` - Update user personal details and contact info.
- `PUT  /api/auth/change-password` - Change account password.

### Student Management (`/api/students`)
- `GET    /api/students` - List all registered students (Admin, Teacher).
- `GET    /api/students/{id}` - Get student profile by ID.
- `GET    /api/students/{id}/classes` - List enrolled classes for a student.
- `POST   /api/students` - Register a new student (Admin).
- `PUT    /api/students/{id}` - Update student record (Admin).
- `DELETE /api/students/{id}` - Delete student record (Admin).

### Faculty Management (`/api/teachers`)
- `GET    /api/teachers` - List all faculty members (Admin).
- `GET    /api/teachers/{id}` - Get faculty details.
- `GET    /api/teachers/{id}/classes` - List classes assigned to faculty.
- `POST   /api/teachers` - Register a new faculty member (Admin).
- `PUT    /api/teachers/{id}` - Update faculty details (Admin).
- `DELETE /api/teachers/{id}` - Delete faculty member (Admin).

### Course & Class Management (`/api/courses`, `/api/classes`)
- `GET    /api/courses` - List academic courses.
- `POST   /api/courses` - Create course (Admin).
- `DELETE /api/courses/{id}` - Delete course (Admin).
- `GET    /api/classes` - List all class sections.
- `POST   /api/classes` - Create a class section with schedule & instructor (Admin).
- `GET    /api/classes/{id}/students` - List enrolled students in a class.
- `POST   /api/classes/{id}/enroll` - Enroll a student into a class section.
- `DELETE /api/classes/{id}/students/{studentId}` - Unenroll a student from a class section.

### Attendance Engine (`/api/attendance`)
- `POST   /api/attendance/sessions` - Create and launch an attendance session with GPS coords and radius (Teacher, Admin).
- `GET    /api/attendance/sessions/active` - Query current active sessions (Student, Teacher).
- `GET    /api/attendance/sessions/{id}` - Fetch session details and live attendees.
- `PUT    /api/attendance/sessions/{id}/stop` - Close an attendance session (Teacher, Admin).
- `POST   /api/attendance/mark` - Mark attendance using student's device GPS coordinates and camera capture (Student).
- `GET    /api/attendance/student/{studentId}` - Query personal attendance history (Student, Admin).
- `GET    /api/attendance/class/{classId}` - Query attendance records for a class section.

### Analytics & Reports (`/api/dashboard`, `/api/reports`, `/api/locations`)
- `GET /api/dashboard/admin` - High-level metrics for admin (counts, attendance rates).
- `GET /api/dashboard/teacher` - Teacher dashboard stats (assigned classes, active sessions).
- `GET /api/dashboard/student` - Student dashboard stats (overall attendance %, streak).
- `GET /api/reports/attendance` - Query filtered attendance log with pagination.
- `GET /api/reports/attendance/export` - Export attendance data as a downloadable `.csv` spreadsheet.
- `GET /api/locations` - Campus geofencing zones.
- `POST /api/locations` - Define a new campus geofence zone.

---

## Geofencing Logic (Haversine Formula)

Attendance is verified on the backend using the Haversine formula in `GeoUtils.java`:

$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

Where:
- $R = 6,371,000\text{ meters}$ (Mean Earth Radius)
- $\varphi_1, \varphi_2$ are latitudes in radians
- $\Delta\varphi = \varphi_2 - \varphi_1$
- $\Delta\lambda = \lambda_2 - \lambda_1$ (difference in longitude)

If $d > \text{allowedRadius}$ (e.g. 50 meters), the backend rejects the attendance submission with `400 Bad Request` and returns the exact distance away from the classroom.

---

## Facial Recognition Architecture

The system provides a real-time camera preview and capture interface using HTML5 WebRTC. The frontend captures an image snapshot when the student marks attendance and transmits the base64-encoded image payload to the backend. The backend architecture contains an extensible verification hook ready to be linked with OpenCV, Python Flask AI microservices, or AWS Rekognition.
