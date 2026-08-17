package com.hackathon.energiai_api.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ModeloApiRequest(
        @JsonProperty("consumo_kwh")
        Integer consumoKwh,

        @JsonProperty("uso_horario_pico")
        Boolean usoHorarioPico,

        @JsonProperty("cantidad_equipos")
        Integer cantidadEquipos,

        @JsonProperty("tipo_inmueble")
        String tipoInmueble,

        @JsonProperty("horas_alto_consumo")
        Integer horasAltoConsumo,

        @JsonProperty("cantidad_personas")
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer cantidadPersonas,

        @JsonProperty("area_m2")
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Double areaM2,

        @JsonProperty("equipos_alto_consumo")
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer equiposAltoConsumo,

        @JsonProperty("equipos_medio_consumo")
        Integer equiposMedioConsumo,

        @JsonProperty("equipos_bajo_consumo")
        Integer equiposBajoConsumo,

        @JsonProperty("horas_aire_acondicionado")
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer horasAireAcondicionado,

        @JsonProperty("consumo_mes_anterior_kwh")
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Double consumoMesAnteriorKwh,

        @JsonProperty("dias_facturados")
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Integer diasFacturados
) {
}
