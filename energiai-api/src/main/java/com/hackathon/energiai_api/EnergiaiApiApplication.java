package com.hackathon.energiai_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
public class EnergiaiApiApplication {

    private static final Logger log = LoggerFactory.getLogger(EnergiaiApiApplication.class);

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(EnergiaiApiApplication.class);
        app.addInitializers((applicationContextInitializer) -> {
            ConfigurableEnvironment env = applicationContextInitializer.getEnvironment();
            String dbPasswordFile = env.getProperty("DB_PASSWORD_FILE");
            if (dbPasswordFile != null && !dbPasswordFile.isBlank()) {
                try {
                    String password = Files.readString(Paths.get(dbPasswordFile)).trim();
                    if (!password.isEmpty()) {
                        Map<String, Object> props = new HashMap<>();
                        props.put("spring.datasource.password", password);
                        env.getPropertySources().addFirst(new MapPropertySource("dbPasswordSecret", props));
                        log.info("Contraseña BD cargada desde archivo secreto: {}", dbPasswordFile);
                    }
                } catch (IOException e) {
                    log.error("No se pudo leer contraseña BD desde archivo: {}", e.getMessage());
                }
            }
        });
        app.run(args);
    }

}
