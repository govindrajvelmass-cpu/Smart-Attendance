# ==========================================================
# SMART ATTENDANCE BACKEND - DOCKERFILE (JAVA 25)
# ==========================================================
# Stage 1: Build application using Eclipse Temurin JDK 25
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

# Copy Maven wrapper and POM configuration
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Ensure Maven wrapper is executable
RUN chmod +x ./mvnw

# Copy source code and build production jar
COPY src src
RUN ./mvnw clean package -DskipTests

# Stage 2: Lean runtime container using Eclipse Temurin JRE 25
FROM eclipse-temurin:25-jre
WORKDIR /app

# Create a non-root group and user for enhanced security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

# Copy compiled jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Cloud platform compatibility: expose dynamic PORT (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
