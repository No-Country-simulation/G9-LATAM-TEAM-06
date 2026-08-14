package com.hackathon.energiai_api.exception;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
                Map<String, String> errors = new HashMap<>();

                ex.getBindingResult().getAllErrors().forEach((ObjectError error) -> {
                        String fieldName = error instanceof FieldError fieldError
                                        ? fieldError.getField()
                                        : "solicitud";
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

        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
                Map<String, String> errors = new HashMap<>();
                ex.getConstraintViolations().forEach(violation ->
                        errors.put(violation.getPropertyPath().toString(), violation.getMessage()));

                logger.warn("Parámetros fuera del contrato: {}", errors);
                return respuestaSolicitudInvalida(
                        "VALIDATION_ERROR",
                        "La solicitud contiene parámetros inválidos",
                        errors
                );
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
                logger.warn("Cuerpo JSON inválido: {}", ex.getMessage());
                return respuestaSolicitudInvalida(
                        "INVALID_JSON",
                        "El cuerpo JSON está mal formado, contiene tipos incorrectos o campos desconocidos",
                        Map.of("solicitud", "Verifica nombres de campos, tipos y estructura JSON")
                );
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
                logger.warn("Tipo de parámetro inválido para {}", ex.getName());
                return respuestaSolicitudInvalida(
                        "INVALID_PARAMETER_TYPE",
                        "Un parámetro tiene un tipo incorrecto",
                        Map.of(ex.getName(), "El valor proporcionado no tiene el tipo esperado")
                );
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

        private ResponseEntity<Map<String, Object>> respuestaSolicitudInvalida(
                String codigo,
                String mensaje,
                Map<String, String> detalles) {
                Map<String, Object> response = new HashMap<>();
                response.put("estado", "error");
                response.put("codigo", codigo);
                response.put("mensaje", mensaje);
                response.put("detalles", detalles);
                return ResponseEntity.badRequest().body(response);
        }
}
