# Smart Attendance - Backend

Production-grade Spring Boot 4 REST API built with Java 25, Spring Data JPA, Spring Security with stateless JWT tokens, and MySQL.

## Tech Stack
- **Java**: 25 (LTS)
- **Framework**: Spring Boot
- **Build Tool**: Apache Maven 3.9.x
- **Database**: MySQL 8.0+ / 9.x
- **Authentication**: Stateless JWT (JJWT 0.12.6) + BCrypt
- **Testing**: JUnit 5, MockMvc, H2 in-memory DB for automated testing

## Project Structure
```
src/main/java/com/smartattendance/backend/
├── BackendApplication.java
├── config/              # Security, CORS, and DataInitializer
├── controller/          # REST Endpoints (Auth, Students, Teachers, Courses, Classes, Sessions, Attendance, Reports, Dashboard)
├── dto/                 # Request and Response Transfer Objects
├── entity/              # JPA Entities and Enums
├── exception/           # Global Exception Handling (@RestControllerAdvice)
├── repository/          # Spring Data JPA Repositories
├── security/            # JWT Token Provider, Filter, UserPrincipal
├── service/             # Business Logic & Haversine Geofence Calculations
└── util/                # GeoUtils & CSV Export
```

## Running the Backend

### 1. Database Configuration
Set environment variables or ensure your local MySQL server is running:
```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_NAME="smart_attendance"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="YOUR_MYSQL_PASSWORD"
```

### 2. Run Tests
```powershell
mvn clean test
```

### 3. Run the Application
```powershell
mvn spring-boot:run
```
The server will start on `http://localhost:8080`.
