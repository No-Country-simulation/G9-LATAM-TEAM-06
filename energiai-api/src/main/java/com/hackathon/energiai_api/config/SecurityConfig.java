package com.hackathon.energiai_api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathon.energiai_api.filter.ApiKeyAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, ApiKeyAuthenticationFilter apiKeyFilter) throws Exception {
        http
            // Deshabilitar CSRF para API REST
            .csrf(AbstractHttpConfigurer::disable)
            
            // Configurar autorización
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/api-docs/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/analisis-energetico/**").hasRole("API_CLIENTE")
                .anyRequest().denyAll()
            )
            
            // Deshabilitar sesiones (no se necesita login API Key)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // Agregar filtro personalizado para API Key
            .addFilterBefore(apiKeyFilter, 
                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
                
        return http.build();
    }
}