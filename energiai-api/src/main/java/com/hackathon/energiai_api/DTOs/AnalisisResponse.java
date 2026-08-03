package com.hackathon.energiai_api.DTOs;

import java.math.BigDecimal;
import java.util.List;

public record AnalisisResponse(
        String categoria,
        BigDecimal probabilidad,
        List<String> recomendaciones,
        BigDecimal costo_estimado_mensual
) {
}
