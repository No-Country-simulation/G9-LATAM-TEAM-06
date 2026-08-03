package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecomendacionService {

    public List<String> generarRecomendaciones(AnalisisRequest request){
        List<String> recomendaciones = new ArrayList<>();

        if (request == null){
            return recomendaciones;
        }

        //Regla 1: Uso durante hora pico
        if (Boolean.TRUE.equals(request.uso_horario_pico())){
            recomendaciones.add("Reducir el uso de equipos durante horarios pico");
        }

        //Regla 2: Muchos equipos conectados
        if (request.cantidad_equipos() != null && request.cantidad_equipos() >=10){
            recomendaciones.add("Evaluar aparatos con alto consumo electrico");
        }

        // Regla 3: Muchas horas de alto consumo
        if (request.horas_alto_consumo() != null && request.horas_alto_consumo() >= 6) {
            recomendaciones.add("Distribuir actividades de mayor consumo a lo largo del día");
        }

        // Recomendación por defecto si el perfil es muy eficiente y no activa ninguna regla
        if (recomendaciones.isEmpty()) {
            recomendaciones.add("Mantener los buenos hábitos de consumo actuales y monitorear periódicamente");
        }

        return recomendaciones;
    }
}
