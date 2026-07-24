package com.hackathon.energiai_api.DTOs;


import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public record AnalisisRequest(
        @NotNull(message = "El consumo en kWh es obligatorio")
        @Min(value= 1, message = "El consumo debe ser mayor a 0")
        Integer consumo_kwh,

        @NotNull(message = "Debe especificar si usa en horario pico")
        Boolean uso_horario_pico,

        @NotNull(message = "La cantidad de equipos es obligatoria")
        Integer cantidad_equipos,

        @NotBlank (message = "El tipo de inmueble es obligatorio")
        String tipo_inmueble,

        @NotNull(message = "Las horas de alto consumo son obligatorias")
        @Min(0) @Max(24)
        Integer horas_alto_consumo
) { }
