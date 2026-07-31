package com.hackathon.energiai_api.DTOs;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;

import java.util.Map;

public record AnalisisRequest(
        @NotNull(message = "El consumo en kWh es obligatorio")
        @Min(
                value = 1,
                message = "El consumo en kWh debe ser mayor a 0"
        )
        @Max(
                value = 100000,
                message = "El consumo en kWh no puede superar los 100.000"
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
        @Max(
                value = 1000,
                message = "La cantidad de equipos no puede superar los 1.000"
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
        Integer horas_alto_consumo,
        String usuarioId,
        Map<String, Integer> electrodomesticos,
        Integer dispositivos_alto,
        Integer dispositivos_medio,
        Integer dispositivos_bajo) {

    @AssertTrue(message = "La suma de electrodomésticos debe igualar la cantidad de equipos")
    public boolean isElectrodomesticosValidos() {
        if (electrodomesticos != null && !electrodomesticos.isEmpty()) {
            int suma = electrodomesticos.values().stream().mapToInt(Integer::intValue).sum();
            return suma == cantidad_equipos;
        }
        if (dispositivos_alto != null || dispositivos_medio != null || dispositivos_bajo != null) {
            int alta = dispositivos_alto != null ? dispositivos_alto : 0;
            int media = dispositivos_medio != null ? dispositivos_medio : 0;
            int baja = dispositivos_bajo != null ? dispositivos_bajo : 0;
            return (alta + media + baja) == cantidad_equipos;
        }
        return true;
    }
}