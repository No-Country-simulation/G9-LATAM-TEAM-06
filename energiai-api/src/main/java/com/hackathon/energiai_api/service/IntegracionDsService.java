package com.hackathon.energiai_api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;

@Service
public class IntegracionDsService {

    public record PrediccionDs(String categoria, BigDecimal probabilidad) {
    }

    private static final int UMBRAL_CONSUMO_INEFICIENTE = 350;
    private static final int UMBRAL_HORAS_ALTO_CONSUMO = 8;
    private static final int UMBRAL_CONSUMO_EFICIENTE = 150;


    public PrediccionDs obtenerPrediccionDs(AnalisisRequest request){
        if (request == null){
            return new PrediccionDs("Moderado", BigDecimal.valueOf(0.50));
        }
        String categoria;
        double probabilidadSimulada;
        
        if (request.consumo_kwh() > UMBRAL_CONSUMO_INEFICIENTE ||(request.horas_alto_consumo() >= UMBRAL_HORAS_ALTO_CONSUMO && Boolean.TRUE.equals(request.uso_horario_pico()))) {
            categoria = "Ineficiente";
            probabilidadSimulada = 0.75 + (Math.random() * 0.20);
        } else if (request.consumo_kwh() < UMBRAL_CONSUMO_EFICIENTE && Boolean.FALSE.equals(request.uso_horario_pico())) {
            categoria = "Eficiente";
            probabilidadSimulada = 0.80 + (Math.random() * 0.15);
        }else {
            categoria = "Moderado";
            probabilidadSimulada = 0.60 + (Math.random() * 0.20);
        }
        BigDecimal probabilidad = BigDecimal.valueOf(probabilidadSimulada).setScale(2, RoundingMode.HALF_UP);

        return new PrediccionDs(categoria, probabilidad);
    }
}
