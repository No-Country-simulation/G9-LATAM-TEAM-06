package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.ModeloApiResponse;
import com.hackathon.energiai_api.DTOs.RecomendacionModelo;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecomendacionService {

    public List<String> generarRecomendaciones(AnalisisRequest request) {
        return generarRecomendaciones(request, null);
    }

    public List<String> generarRecomendaciones(AnalisisRequest request, ModeloApiResponse modeloResponse) {
        List<String> recomendaciones = new ArrayList<>();

        if (modeloResponse != null && modeloResponse.recomendaciones() != null && !modeloResponse.recomendaciones().isEmpty()) {
            for (RecomendacionModelo rec : modeloResponse.recomendaciones()) {
                recomendaciones.add(rec.texto());
            }
            return recomendaciones;
        }

        if (request == null) {
            return recomendaciones;
        }

        if (Boolean.TRUE.equals(request.uso_horario_pico())) {
            recomendaciones.add("Reducir el uso de equipos durante horarios pico");
        }

        if (request.cantidad_equipos() != null && request.cantidad_equipos() >= 10) {
            recomendaciones.add("Evaluar aparatos con alto consumo electrico");
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