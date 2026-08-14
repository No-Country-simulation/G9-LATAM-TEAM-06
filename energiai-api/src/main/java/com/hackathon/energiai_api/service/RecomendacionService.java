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

    public List<String> generarRecomendaciones(AnalisisRequest request, ModeloApiResponse modeloResponse) {
        List<String> recomendaciones = new ArrayList<>();

        if (modeloResponse != null && modeloResponse.recomendaciones() != null && !modeloResponse.recomendaciones().isEmpty()) {
            boolean hayAccionConcreta = modeloResponse.recomendaciones().stream()
                    .anyMatch(rec -> !CODIGO_MANTENER_HABITOS.equals(rec.codigo()));
            for (RecomendacionModelo rec : modeloResponse.recomendaciones()) {
                if (!hayAccionConcreta || !CODIGO_MANTENER_HABITOS.equals(rec.codigo())) {
                    recomendaciones.add(rec.texto());
                }
            }
            return recomendaciones;
        }

        if (request == null) {
            return recomendaciones;
        }

        if (Boolean.TRUE.equals(request.uso_horario_pico())) {
            recomendaciones.add("Reducir el uso de equipos durante horarios pico");
        }

        if (request.equiposAltoResueltos() != null && request.equiposAltoResueltos() > 0) {
            recomendaciones.add("Priorizar el uso eficiente y mantenimiento de los equipos de mayor demanda");
        }

        if (request.equiposMedioResueltos() != null && request.equiposMedioResueltos() > 0) {
            recomendaciones.add("Programar y agrupar el uso de los equipos de consumo medio para evitar funcionamiento innecesario");
        }

        if (request.equiposBajoResueltos() != null && request.equiposBajoResueltos() > 0) {
            recomendaciones.add("Desconectar o suspender los equipos de bajo consumo cuando no esten en uso para reducir consumos acumulados");
        }

        if (request.horas_alto_consumo() != null && request.horas_alto_consumo() >= 6) {
            recomendaciones.add("Distribuir actividades de mayor consumo a lo largo del día");
        }

        if (recomendaciones.isEmpty()) {
            recomendaciones.add("Mantener los buenos hábitos de consumo actuales y monitorear periódicamente");
        }

        return recomendaciones;
    }
}
