# ==========================================================
# SMART ATTENDANCE BACKEND - ROOT DOCKERFILE (JAVA 25)
# ==========================================================
# Stage 1: Build Spring Boot backend using Eclipse Temurin JDK 25
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Copy Maven wrapper and POM from backend directory
COPY backend/mvnw backend/mvnw.cmd backend/pom.xml ./
COPY backend/.mvn .mvn

# Ensure Maven wrapper is executable
RUN chmod +x ./mvnw

# Copy backend source code
COPY backend/src src

# Package production jar skipping tests
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal runtime image using Eclipse Temurin JRE 25
FROM eclipse-temurin:25-jre
WORKDIR /app

# Non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

# Copy built JAR from build stage
COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
