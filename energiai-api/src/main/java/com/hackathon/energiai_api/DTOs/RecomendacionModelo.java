package com.hackathon.energiai_api.DTOs;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record RecomendacionModelo(
        @JsonProperty("codigo")
        String codigo,

        @JsonProperty("texto")
        String texto,

        @JsonProperty("confianza")
        Double confianza,

        @JsonProperty("factores_clave")
        List<String> factoresClave
) {
    public RecomendacionModelo(String codigo, String texto, Double confianza) {
        this(codigo, texto, confianza, List.of());
    }
}
