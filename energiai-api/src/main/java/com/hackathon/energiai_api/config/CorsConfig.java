package com.hackathon.energiai_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/analisis-energetico/**")
                .allowedOrigins("http://localhost", "http://localhost:80", "http://localhost:8080", "http://127.0.0.1", "http://127.0.0.1:80", "http://127.0.0.1:8080")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept", "X-API-KEY")
                .maxAge(3600)
                .allowCredentials(false);
    }
    
}
