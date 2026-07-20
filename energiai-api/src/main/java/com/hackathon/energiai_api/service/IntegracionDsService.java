package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class IntegracionDsService {

    public record PrediccionDs(String categoria, BigDecimal probabilidad){}

    public PrediccionDs obtenerPrediccionDs(AnalisisRequest request){
        if (request == null){
            return new PrediccionDs("Moderado", new BigDecimal(0.50));
        }
        String categoria;
        double probabilidadSimulada;

        if (request.consumo_kwh()>350 ||request.horas_alto_consumo() >= 8 && Boolean.TRUE.equals(request.uso_horario_pico())){
            categoria = "Ineficiente";
            probabilidadSimulada = 0.75 + (Math.random() * 0.20);
        } else if (request.consumo_kwh() < 150 && Boolean.FALSE.equals(request.uso_horario_pico())) {
            categoria = "Eficiente";
            probabilidadSimulada = 0.80 + (Math.random() * 0.15);
        }else {
            categoria = "Moderado";
            probabilidadSimulada = 0.60 + (Math.random() * 0.20);
        }
        BigDecimal probabilidad = new BigDecimal(probabilidadSimulada).setScale(2, RoundingMode.HALF_UP);

        return new PrediccionDs(categoria, probabilidad);
    }
}
