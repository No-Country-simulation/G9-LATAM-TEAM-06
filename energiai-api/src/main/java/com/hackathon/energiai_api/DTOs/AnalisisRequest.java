package com.hackathon.energiai_api.DTOs;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AnalisisRequest(

        @NotNull(message = "El consumo en kWh es obligatorio")
        @Min(
                value = 1,
                message = "El consumo en kWh debe ser mayor a 0"
        )
        Integer consumo_kwh,

        @NotNull(
                message = "Debe especificar si utiliza energía durante el horario pico"
        )
        Boolean uso_horario_pico,

        @NotNull(message = "La cantidad de equipos es obligatoria")
        @Min(
                value = 1,
                message = "La cantidad de equipos debe ser mayor a 0"
        )
        Integer cantidad_equipos,

        @NotBlank(message = "El tipo de inmueble es obligatorio")
        @Size(
                max = 50,
                message = "El tipo de inmueble no puede superar los 50 caracteres"
        )
        String tipo_inmueble,

        @NotNull(message = "Las horas de alto consumo son obligatorias")
        @Min(
                value = 0,
                message = "Las horas de alto consumo no pueden ser negativas"
        )
        @Max(
                value = 24,
                message = "Las horas de alto consumo no pueden superar las 24 horas"
        )
        Integer horas_alto_consumo

) {
}