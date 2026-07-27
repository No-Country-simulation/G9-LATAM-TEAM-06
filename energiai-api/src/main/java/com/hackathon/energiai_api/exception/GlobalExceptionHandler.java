package com.hackathon.energiai_api.exception;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.hackathon.energiai_api.DTOs.ApiErrorResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();

        exception.getBindingResult().getAllErrors().forEach(error -> {
            if (error instanceof FieldError fieldError) {
                fieldErrors.put(
                        fieldError.getField(),
                        fieldError.getDefaultMessage()
                );
            }
        });

        ApiErrorResponse response = createErrorResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "La solicitud contiene datos inválidos",
                request.getRequestURI(),
                fieldErrors
        );

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleMalformedJson(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {

        LOGGER.warn(
                "Solicitud JSON inválida en {}",
                request.getRequestURI()
        );

        ApiErrorResponse response = createErrorResponse(
                HttpStatus.BAD_REQUEST,
                "MALFORMED_JSON",
                "El cuerpo contiene un JSON inválido o un tipo de dato incorrecto",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiErrorResponse> handleDatabaseException(
            DataAccessException exception,
            HttpServletRequest request) {

        LOGGER.error(
                "Error de base de datos al procesar {}",
                request.getRequestURI(),
                exception
        );

        ApiErrorResponse response = createErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE,
                "DATABASE_ERROR",
                "No fue posible procesar la solicitud en este momento",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(response);
    }

    @ExceptionHandler(ServicioAnalisisException.class)
        public ResponseEntity<ApiErrorResponse> handleServicioAnalisisException(
                ServicioAnalisisException exception,
                HttpServletRequest request) {

            LOGGER.error(
                    "Error en el servicio de análisis al procesar {}",
                    request.getRequestURI(),
                    exception
            );

            ApiErrorResponse response = createErrorResponse(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "ANALYSIS_SERVICE_ERROR",
                    "El servicio de análisis energético no está disponible temporalmente",
                    request.getRequestURI(),
                    Map.of()
            );

            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(response);
        }
        
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception exception,
            HttpServletRequest request) {

        LOGGER.error(
                "Error inesperado al procesar {}",
                request.getRequestURI(),
                exception
        );

        ApiErrorResponse response = createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "Ocurrió un error inesperado en el servidor",
                request.getRequestURI(),
                Map.of()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    private ApiErrorResponse createErrorResponse(
            HttpStatus status,
            String error,
            String message,
            String path,
            Map<String, String> fieldErrors) {

        return new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                error,
                message,
                path,
                fieldErrors
        );
    }
}