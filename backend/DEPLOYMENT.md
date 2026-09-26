# 🚀 Backend Deployment Guide - Smart Attendance System

This backend is built with **Spring Boot 4 / Java 25 (LTS)** and connects to a **MySQL** database. It is fully containerized with Docker and configured to run seamlessly on modern cloud platforms.

---

## 📋 Table of Contents
1. [Cloud Readiness Features](#cloud-readiness-features)
2. [Option 1: Railway (Easiest All-in-One Backend + MySQL) - Recommended](#option-1-railway-all-in-one-backend--mysql)
3. [Option 2: Render + Free Cloud MySQL (Render Web Service)](#option-2-render--free-cloud-mysql)
4. [Option 3: VPS / Self-Hosting (Docker Compose)](#option-3-vps--self-hosting-docker-compose)
5. [Connecting Your Frontend (Vercel)](#connecting-your-frontend-vercel)
6. [Environment Variables Reference](#environment-variables-reference)

---

## 🛠 Cloud Readiness Features
The backend has been pre-configured with:
- **Dynamic Port Binding**: Reads `${PORT:8080}` as required by Render, Railway, Heroku, etc.
- **Auto Database URL Parsing**: Accepts standard JDBC URLs or cloud-style `mysql://user:pass@host:port/dbname` (auto-converted to JDBC).
- **CORS Configured**: Allows `https://smart-attendance-six-black.vercel.app` and all `*.vercel.app` preview URLs by default.
- **Built-in Health Check**: Endpoint available at `/api/health` (returns `{"status":"ok"}`).
- **Multi-Stage Java 25 Dockerfile**: Optimized Eclipse Temurin JDK 25 builder + JRE 25 runtime.

---

## Option 1: Railway (All-in-One Backend + MySQL)
*Railway lets you deploy both the Spring Boot backend and a managed MySQL database in a single project with automatic linking.*

### Step 1: Push code to GitHub
Run the project update script:
```powershell
.\push_to_github.bat
```
*(Or commit and push your changes to `main` branch)*

### Step 2: Create a Project on Railway
1. Go to [railway.app](https://railway.app/) and sign in with GitHub.
2. Click **"+ New Project"** -> **"Provision MySQL"**.
3. Railway creates a managed MySQL service.

### Step 3: Add Backend Service
1. In the same Railway project canvas, click **"+ Create"** -> **"GitHub Repo"**.
2. Select your repository: `govindrajvelmass-cpu/Smart-Attendance`.
3. Click on the newly added service -> Go to **Settings**:
   - **Root Directory**: Set to `/backend`
   - **Builder**: Dockerfile (Railway detects `backend/Dockerfile` automatically)
4. Go to **Variables** tab and click **"Add Variable"** / **"Add Reference"**:
   - Link `MYSQL_URL` from the MySQL service (or add `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`)
   - `JWT_SECRET`: Any random 64-character secret
   - `FRONTEND_URL`: `https://smart-attendance-six-black.vercel.app`
5. Go to **Settings** -> **Networking** -> Click **"Generate Domain"** to get your public HTTPS URL (e.g., `https://smart-attendance-backend-production.up.railway.app`).

---

## Option 2: Render + Free Cloud MySQL
*Render provides a free Web Service tier. Pair it with a free cloud MySQL database (such as Aiven.io, Clever Cloud, or TiDB Cloud).*

### Step 1: Set up Free MySQL Database
Create a free MySQL database on:
- [Aiven.io](https://aiven.io/) (Free MySQL service) OR
- [Clever Cloud](https://www.clever-cloud.com/) (Free MySQL add-on) OR
- [TiDB Cloud](https://tidbcloud.com/) (Serverless MySQL-compatible tier)

Copy the host, port, database name, username, and password.

### Step 2: Deploy to Render
1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **"New +"** -> **"Web Service"**.
2. Connect your GitHub repository `Smart-Attendance`.
3. Configure settings:
   - **Name**: `smart-attendance-backend`
   - **Region**: Choose closest to you (e.g., Singapore / Frankfurt / Oregon)
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`
4. Add **Environment Variables**:
   - `SPRING_DATASOURCE_URL`: `jdbc:mysql://<HOST>:<PORT>/<DATABASE>?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`
   - `SPRING_DATASOURCE_USERNAME`: `<DB_USER>`
   - `SPRING_DATASOURCE_PASSWORD`: `<DB_PASSWORD>`
   - `JWT_SECRET`: `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`
   - `FRONTEND_URL`: `https://smart-attendance-six-black.vercel.app`
   - `MAIL_USERNAME`: `your-gmail@gmail.com` *(optional for email)*
   - `MAIL_PASSWORD`: `your-16-char-app-password` *(optional for email)*
5. Set **Health Check Path** to `/api/health`.
6. Click **"Create Web Service"**.
7. Once deployed, Render will provide a live URL: `https://<service-name>.onrender.com`.

---

## Option 3: VPS / Self-Hosting (Docker Compose)
*If you have an Ubuntu/Debian VPS, AWS EC2, or DigitalOcean Droplet:*

1. Clone repository to server:
   ```bash
   git clone https://github.com/govindrajvelmass-cpu/Smart-Attendance.git
   cd Smart-Attendance
   ```
2. Start MySQL and Backend together:
   ```bash
   docker compose up -d --build
   ```
3. Test health:
   ```bash
   curl http://localhost:8080/api/health
   # Returns: {"status":"ok"}
   ```

---

## 🔗 Connecting Your Frontend (Vercel)
Once your backend is running and you have its live URL (e.g., `https://smart-attendance-api.onrender.com`):

1. Open your Vercel Dashboard -> Go to `smart-attendance` project.
2. Go to **Settings** -> **Environment Variables**.
3. Update or add:
   - `VITE_API_URL` = `https://<YOUR-BACKEND-DOMAIN>/api`
   - `VITE_API_BASE_URL` = `https://<YOUR-BACKEND-DOMAIN>/api`
4. Redeploy frontend on Vercel (or trigger new build).
5. Open `https://smart-attendance-six-black.vercel.app` and log in!

---

## 🔐 Environment Variables Reference

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | HTTP port the server listens on | `8080` |
| `SPRING_DATASOURCE_URL` or `DATABASE_URL` | JDBC or MySQL Connection string | `jdbc:mysql://localhost:3306/smart_attendance` |
| `SPRING_DATASOURCE_USERNAME` or `DB_USERNAME` | Database username | `root` |
| `SPRING_DATASOURCE_PASSWORD` or `DB_PASSWORD` | Database password | `govind2007` |
| `JWT_SECRET` | 256-bit Hex Secret for JWT signatures | Default secure key |
| `FRONTEND_URL` | Base URL of frontend application | `https://smart-attendance-six-black.vercel.app` |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `localhost, vercel.app, trycloudflare.com` |
| `MAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | SMTP email address | - |
| `MAIL_PASSWORD` | SMTP app password | - |
