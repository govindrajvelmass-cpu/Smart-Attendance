# MySQL Database Setup Guide - Smart Attendance

This guide details how to create and initialize the MySQL database for the **Smart Attendance Management System** using **MySQL Workbench**.

---

## 1. Prerequisites
- **MySQL Server** installed and running (MySQL 8.0+ or MySQL 9.x)
- **MySQL Workbench** installed

---

## 2. Step-by-Step Instructions in MySQL Workbench

### Step 1: Open MySQL Workbench
Launch **MySQL Workbench** from your Windows Start menu or desktop shortcut.

### Step 2: Connect to Local MySQL Server
1. On the MySQL Workbench home screen, click on your local connection tile (usually named **Local instance MySQL80** or **localhost:3306**).
2. Enter your MySQL `root` password when prompted.
3. Click **OK** to open the SQL Query Editor.

### Step 3: Open the Schema SQL Script
1. In the top menu bar, click:
   `File` ➔ `Open SQL Script...` (or press `Ctrl + Shift + O`).
2. Navigate to your project folder and select:
   ```
   C:\Users\GOVINDARAJ\OneDrive\Desktop\Smart_Attendance\backend\database\schema.sql
   ```
3. Click **Open**. The SQL file will display in a new query tab.

### Step 4: Execute the SQL Script
1. Click the **Execute** button (the yellow lightning bolt icon ⚡) in the query toolbar (or press `Ctrl + Shift + Enter`).
2. Check the **Action Output** pane at the bottom. You should see green checkmarks indicating:
   - Database `smart_attendance` created.
   - 11 tables created: `users`, `teachers`, `students`, `courses`, `classes`, `enrollments`, `locations`, `attendance_sessions`, `attendance`, `notifications`, `refresh_tokens`.
   - Safe initial seed data inserted (Admin, Teachers, Students, Courses, Classes, Campus Locations, Sample Sessions).

### Step 5: Verify the Tables in Schemas Tab
1. In the left **Navigator** sidebar, click on the **Schemas** tab.
2. Right-click anywhere in the Schemas area and click **Refresh All**.
3. Expand `smart_attendance` ➔ `Tables`.
4. Right-click on `users` and select **Select Rows - Limit 1000**.
5. Verify the seeded users exist with their secure BCrypt hashes.

---

## 3. Seed Accounts & Login Credentials

All passwords in the database are stored as **BCrypt** hashes.

| Role | Name / Identifier | Email / Username | Default Password |
| :--- | :--- | :--- | :--- |
| **ADMIN** | System Administrator | `admin@smartattendance.com` | `Admin@123` |
| **TEACHER** | Dr. Ramesh Sharma (EMP-1001) | `teacher1@smartattendance.com` | `Teacher@123` |
| **TEACHER** | Prof. Ananya Patel (EMP-1002) | `teacher2@smartattendance.com` | `Teacher@123` |
| **STUDENT** | Aarav Verma (STU-2026-001) | `student1@smartattendance.com` | `Student@123` |
| **STUDENT** | Diya Nair (STU-2026-002) | `student2@smartattendance.com` | `Student@123` |
| **STUDENT** | Karan Mehta (STU-2026-003) | `student3@smartattendance.com` | `Student@123` |
| **STUDENT** | Sneha Rao (STU-2026-004) | `student4@smartattendance.com` | `Student@123` |
| **STUDENT** | Vikram Singh (STU-2026-005) | `student5@smartattendance.com` | `Student@123` |

> [!WARNING]
> These seed credentials are intended for local development and demonstration. Change all passwords prior to production deployment.

---

## 4. Backend Environment Configuration

When starting the Spring Boot backend, set your MySQL password via environment variable or in `application-dev.properties`:

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_NAME="smart_attendance"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="YOUR_MYSQL_PASSWORD"
```
