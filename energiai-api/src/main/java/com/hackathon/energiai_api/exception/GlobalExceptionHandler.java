package com.hackathon.energiai_api.exception;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
                Map<String, String> errors = new HashMap<>();

                ex.getBindingResult().getAllErrors().forEach((error) -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                });

                Map<String, Object> response = new HashMap<>();
                response.put("estado", "error");
                response.put("codigo", "VALIDATION_ERROR");
                response.put("mensaje", "La solicitud contiene datos inválidos");
                response.put("detalles", errors);

                logger.warn("Error de validación: {}", errors);

                return ResponseEntity.badRequest().body(response);
        }

        @ExceptionHandler(ServicioAnalisisException.class)
        public ResponseEntity<Map<String, Object>> handleServicioAnalisisException(ServicioAnalisisException ex) {
                Map<String, Object> response = new HashMap<>();
                response.put("estado", "error");
                response.put("codigo", "ANALISIS_ERROR");
                response.put("mensaje", ex.getMessage());

                logger.error("Error en el servicio de análisis: {}", ex);

                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<Map<String, Object>> handlerGenericException(Exception ex) {
                Map<String, Object> response = new HashMap<>();
                response.put("estado", "error");
                response.put("codigo", "INTERNAL_SERVER_ERROR");
                response.put("mensaje", "Ocurrió un error inesperado en el servidor");

                logger.error("Error no manejado", ex);

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
}
