package com.hackathon.energiai_api.DTOs;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ModeloApiResponse(
        @JsonProperty("categoria")
        String categoria,

        @JsonProperty("probabilidad")
        Double probabilidad,

        @JsonProperty("nivel_analisis")
        String nivelAnalisis,

        @JsonProperty("campos_imputados")
        List<String> camposImputados,

        @JsonProperty("recomendaciones")
        List<RecomendacionModelo> recomendaciones,

        @JsonProperty("origen_prediccion")
        String origenPrediccion,

        @JsonProperty("modelo_version")
        String modeloVersion,

        @JsonProperty("advertencias")
        List<String> advertencias
) {
    public ModeloApiResponse(
            String categoria,
            Double probabilidad,
            String nivelAnalisis,
            List<String> camposImputados,
            List<RecomendacionModelo> recomendaciones) {
        this(
                categoria,
                probabilidad,
                nivelAnalisis,
                camposImputados,
                recomendaciones,
                "modelo_ml",
                "no_reportada",
                List.of());
    }
}
