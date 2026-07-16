FROM eclipse-temurin:25-jdk-noble
WORKDIR /app

RUN apt-get update && \
    apt-get install -y maven && \
    rm -rf /var/lib/apt/lists/*

COPY pom.xml .
# CORRECCIÓN: Añadimos 'validate' para especificar un ciclo válido a Maven
RUN mvn dependency:go-offline validate -B

COPY src ./src
EXPOSE 8080
# Comando para arrancar Spring Boot en modo desarrollo con DevTools activo
CMD ["mvn", "spring-boot:run"]