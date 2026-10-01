# ============================================================================
# Stage 1: Build the Spring Boot application using Maven
# ============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /workspace

# Copy source code and Maven descriptors
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B

# ============================================================================
# Stage 2: Lightweight Production Runtime Image
# ============================================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root system user for container security
RUN addgroup -S connecthub && adduser -S connecthub -G connecthub

# Copy packaged jar from builder stage
COPY --from=builder /workspace/target/*.jar /app/app.jar

# Ensure upload directory exists and is writable
RUN mkdir -p /app/uploads && chown -R connecthub:connecthub /app

USER connecthub

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/auth/health || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", \
    "/app/app.jar"]
