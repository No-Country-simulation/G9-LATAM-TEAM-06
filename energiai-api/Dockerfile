# Stage 1: Build con maven
FROM maven:latest AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtine solo con JRE sin maven
FROM eclipse-temurin:25-jre
WORKDIR /app

# Crear usuario no root por seguridad
RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /app/target/energiai-api-*.jar app.jar

# Cambiar permisos
RUN chown appuser:appuser app.jar

USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
