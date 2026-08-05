package com.hackathon.energiai_api.DTOs;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record AnalisisRequest(

        @NotNull(message = "El consumo en kWh es obligatorio")
        @Min(
                value = 1,
                message = "El consumo en kWh debe ser mayor a 0"
        )
        @Max(
                value = 5000,
                message = "El consumo en kWh no puede superar los 5000 kWh mensuales"
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
        Integer horas_alto_consumo,

        @Min(
                value = 1,
                message = "La cantidad de personas debe ser mayor a 0"
        )
        Integer cantidad_personas,

        @Positive(message = "El área del inmueble debe ser mayor a 0")
        Double area_m2,

        @PositiveOrZero(
                message = "La cantidad de equipos de alto consumo no puede ser negativa"
        )
        Integer equipos_alto_consumo,

        @PositiveOrZero(
                message = "Las horas de aire acondicionado no pueden ser negativas"
        )
        @Max(
                value = 24,
                message = "Las horas de aire acondicionado no pueden superar las 24 horas"
        )
        Double horas_aire_acondicionado,

        @Positive(
                message = "El consumo del mes anterior debe ser mayor a 0"
        )
        Double consumo_mes_anterior_kwh,

        @Min(
                value = 1,
                message = "Los días facturados deben ser mayores a 0"
        )
        Integer dias_facturados

) {

    @AssertTrue(
            message = "Los equipos de alto consumo no pueden superar la cantidad total de equipos"
    )
    public boolean isCantidadEquiposAltoConsumoValida() {
        if (equipos_alto_consumo == null || cantidad_equipos == null) {
            return true;
        }

        return equipos_alto_consumo <= cantidad_equipos;
    }
}
