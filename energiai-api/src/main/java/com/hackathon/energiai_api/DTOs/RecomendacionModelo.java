package com.hackathon.energiai_api.DTOs;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RecomendacionModelo(
        @JsonProperty("codigo")
        String codigo,

        @JsonProperty("texto")
        String texto,

        @JsonProperty("confianza")
        Double confianza
) {
}