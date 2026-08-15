package com.hackathon.energiai_api.DTOs;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record HistorialResponse(
        Long id,
        LocalDateTime creadoEn,
        String usuario,
        Integer consumoKwh,
        String tipoInmueble,
        Integer cantidadEquipos,
        Integer horasAltoConsumo,
        Boolean usoHorarioPico,
        String categoria,
        BigDecimal probabilidad,
        BigDecimal costo_estimado_mensual,
        List<String> recomendaciones,
        Map<String, Integer> clasificacion_equipos,
        List<RecomendacionModelo> recomendaciones_detalle,
        String origen_prediccion,
        String modelo_version,
        List<String> advertencias,
        String nombre_o_numero_analisis
) {
}
