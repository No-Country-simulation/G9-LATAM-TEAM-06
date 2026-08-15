package com.hackathon.energiai_api.DTOs;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AnalisisResponse(
        String categoria,
        BigDecimal probabilidad,
        List<String> recomendaciones,
        BigDecimal costo_estimado_mensual,
        Map<String, Integer> clasificacion_equipos,
        String nivel_analisis,
        List<String> campos_imputados,
        List<RecomendacionModelo> recomendaciones_detalle,
        String origen_prediccion,
        String modelo_version,
        List<String> advertencias,
        String nombre_o_numero_analisis
) {
}
