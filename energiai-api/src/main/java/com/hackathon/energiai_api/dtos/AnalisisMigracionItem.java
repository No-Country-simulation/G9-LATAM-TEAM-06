package com.hackathon.energiai_api.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Un análisis local (navegador) listo para migrar a la BD.
 * Contiene la solicitud original (para reconstruir el registro con fidelidad)
 * y el resultado ya calculado por el modelo, sin volver a predecir.
 */
public record AnalisisMigracionItem(
        @NotNull(message = "La solicitud original del análisis es obligatoria")
        @Valid
        AnalisisRequest solicitud,

        @NotBlank(message = "La categoría es obligatoria")
        @Pattern(regexp = "Eficiente|Moderado|Ineficiente", message = "La categoría debe ser Eficiente, Moderado o Ineficiente")
        String categoria,

        @NotNull(message = "La probabilidad es obligatoria")
        @DecimalMin(value = "0.0", message = "La probabilidad no puede ser negativa")
        @DecimalMax(value = "1.0", message = "La probabilidad no puede superar 1.0")
        BigDecimal probabilidad,

        @NotNull(message = "El costo estimado mensual es obligatorio")
        @DecimalMin(value = "0.0", message = "El costo estimado no puede ser negativo")
        BigDecimal costo_estimado_mensual,

        @Size(max = 20, message = "La lista de recomendaciones no puede superar 20 elementos")
        List<String> recomendaciones,

        Map<String, Integer> clasificacion_equipos,

        @Size(max = 20, message = "El nivel de análisis no puede superar 20 caracteres")
        String nivel_analisis,

        @Size(max = 30, message = "La lista de campos imputados no puede superar 30 elementos")
        List<String> campos_imputados,

        @Size(max = 20, message = "La lista de recomendaciones detalladas no puede superar 20 elementos")
        List<RecomendacionModelo> recomendaciones_detalle,

        @Size(max = 30, message = "El origen de predicción no puede superar 30 caracteres")
        String origen_prediccion,

        @Size(max = 100, message = "La versión del modelo no puede superar 100 caracteres")
        String modelo_version,

        @Size(max = 30, message = "La lista de advertencias no puede superar 30 elementos")
        List<String> advertencias) {
}