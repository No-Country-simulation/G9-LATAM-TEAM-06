# Stage 1: Build con maven
FROM maven:3.9.11-eclipse-temurin-21 AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package

# Stage 2: Runtine solo con JRE sin maven
FROM eclipse-temurin:21-jre
WORKDIR /app

# Crear usuario no root por seguridad
RUN groupadd -r appuser && useradd -r -g appuser appuser

# curl para el healthcheck de la API
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/energiai-api-*.jar app.jar

# Cambiar permisos
RUN chown appuser:appuser app.jar

USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
