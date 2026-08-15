package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.ModeloApiResponse;
import com.hackathon.energiai_api.DTOs.RecomendacionModelo;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecomendacionService {

    private static final String CODIGO_MANTENER_HABITOS = "rec_mantener_habitos";

    public List<String> generarRecomendaciones(AnalisisRequest request) {
        return generarRecomendaciones(request, null);
    }

    public List<String> generarRecomendaciones(
            AnalisisRequest request, ModeloApiResponse modeloResponse) {
        return generarRecomendacionesDetalle(request, modeloResponse).stream()
                .map(RecomendacionModelo::texto)
                .toList();
    }

    public List<RecomendacionModelo> generarRecomendacionesDetalle(
            AnalisisRequest request, ModeloApiResponse modeloResponse) {
        List<RecomendacionModelo> recomendaciones = new ArrayList<>();

        if (modeloResponse != null
                && modeloResponse.recomendaciones() != null
                && !modeloResponse.recomendaciones().isEmpty()) {
            boolean hayAccionConcreta = modeloResponse.recomendaciones().stream()
                    .anyMatch(rec -> !CODIGO_MANTENER_HABITOS.equals(rec.codigo()));
            for (RecomendacionModelo rec : modeloResponse.recomendaciones()) {
                if (!hayAccionConcreta || !CODIGO_MANTENER_HABITOS.equals(rec.codigo())) {
                    recomendaciones.add(rec);
                }
            }
            return recomendaciones;
        }

        if (request == null) {
            return recomendaciones;
        }
        if (Boolean.TRUE.equals(request.uso_horario_pico())) {
            recomendaciones.add(fallback(
                    "fallback_reducir_horario_pico",
                    "Reducir el uso de equipos durante horarios pico",
                    "Se reportó uso de energía durante el horario pico."));
        }
        if (request.equiposAltoResueltos() != null && request.equiposAltoResueltos() > 0) {
            recomendaciones.add(fallback(
                    "fallback_equipos_alto_consumo",
                    "Priorizar el uso eficiente y mantenimiento de los equipos de mayor demanda",
                    request.equiposAltoResueltos() + " equipos son de alto consumo."));
        }
        if (request.equiposMedioResueltos() != null && request.equiposMedioResueltos() > 0) {
            recomendaciones.add(fallback(
                    "fallback_equipos_medio_consumo",
                    "Programar y agrupar el uso de los equipos de consumo medio para evitar funcionamiento innecesario",
                    request.equiposMedioResueltos() + " equipos son de consumo medio."));
        }
        if (request.equiposBajoResueltos() != null && request.equiposBajoResueltos() > 0) {
            recomendaciones.add(fallback(
                    "fallback_consumo_en_espera",
                    "Desconectar o suspender los equipos de bajo consumo cuando no estén en uso para reducir consumos acumulados",
                    request.equiposBajoResueltos() + " equipos pueden acumular consumo en espera."));
        }
        if (request.horas_alto_consumo() != null && request.horas_alto_consumo() >= UmbralesModelo.HORAS_ALTO_CONSUMO_RECOMENDACION) {
            recomendaciones.add(fallback(
                    "fallback_distribuir_alto_consumo",
                    "Distribuir actividades de mayor consumo a lo largo del día",
                    "Se reportaron " + request.horas_alto_consumo() + " horas de alto consumo."));
        }
        if (recomendaciones.isEmpty()) {
            recomendaciones.add(fallback(
                    "fallback_mantener_habitos",
                    "Mantener los buenos hábitos de consumo actuales y monitorear periódicamente",
                    "Las reglas de respaldo no detectaron una acción correctiva prioritaria."));
        }
        return recomendaciones;
    }

    private RecomendacionModelo fallback(String codigo, String texto, String factor) {
        return new RecomendacionModelo(codigo, texto, null, List.of(factor));
    }
}
