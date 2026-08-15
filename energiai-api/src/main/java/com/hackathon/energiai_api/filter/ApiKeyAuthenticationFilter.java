package com.hackathon.energiai_api.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(ApiKeyAuthenticationFilter.class);

    private static final String API_KEY_HEADER = "X-API-KEY";

    @Value("${api.key.secret}")
    private String apiKeySecret;

    @Value("${api.key.secret.file:}")
    private String apiKeySecretFile;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String requestURI = request.getRequestURI();

        // Saltar filtro para rutas públicas (health, info, swagger) y preflight OPTIONS
        if (pathMatcher.match("/actuator/health", requestURI) ||
            pathMatcher.match("/actuator/info", requestURI) ||
            pathMatcher.match("/swagger-ui/**", requestURI) ||
            pathMatcher.match("/swagger-ui.html", requestURI) ||
            pathMatcher.match("/api-docs/**", requestURI) ||
            pathMatcher.match("/v3/api-docs/**", requestURI) ||
            "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = request.getHeader(API_KEY_HEADER);
        
        String effectiveApiKeySecret = resolveApiKeySecret();

        logger.debug("Request URI: {}", requestURI);
        logger.debug("API Key header received: {}", apiKey != null ? "present" : "missing");
        logger.debug("Effective API key: {}", effectiveApiKeySecret != null ? "present" : "missing");

        if (effectiveApiKeySecret == null) {
            logger.error("API Key no configurada en el servidor para URI: {}", requestURI);
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            response.getWriter().write("API Key no configurada en el servidor");
            return;
        }

        if (apiKey == null || !effectiveApiKeySecret.equals(apiKey)) {
            logger.warn("API Key validation failed for URI: {}", requestURI);
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("API Key inválido");
            return;
        }

        // API Key válido → autenticar la request
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            "api-client", null, List.of(new SimpleGrantedAuthority("ROLE_API_CLIENTE"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        filterChain.doFilter(request, response);
    }

    private String resolveApiKeySecret() {
        // Prioridad 1: Leer desde archivo (Docker Secrets)
        if (apiKeySecretFile != null && !apiKeySecretFile.isBlank()) {
            try {
                String secretFromFile = Files.readString(Paths.get(apiKeySecretFile)).trim();
                if (!secretFromFile.isEmpty()) {
                    logger.info("API Key cargada desde archivo: {}", apiKeySecretFile);
                    return secretFromFile;
                }
            } catch (IOException e) {
                logger.warn("No se pudo leer API Key desde archivo {}: {}", apiKeySecretFile, e.getMessage());
            }
        }
        
        // Prioridad 2: Valor directo desde property/env (fallback para desarrollo sin secrets)
        if (apiKeySecret != null && !apiKeySecret.isBlank()) {
            logger.info("API Key cargada desde property/env");
            return apiKeySecret;
        }
        
        logger.error("API Key no configurada (ni archivo ni property)");
        return null;
    }
}