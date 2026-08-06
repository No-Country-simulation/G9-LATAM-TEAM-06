package com.hackathon.energiai_api.DTOs;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AnalisisResponse(
        String categoria,
        BigDecimal probabilidad,
        List<String> recomendaciones,
        BigDecimal costo_estimado_mensual,
        Map<String, Integer> clasificacion_equipos
) {
}