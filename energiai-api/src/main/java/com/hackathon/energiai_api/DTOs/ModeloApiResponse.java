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
        List<RecomendacionModelo> recomendaciones
) {
}