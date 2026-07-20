package com.hackathon.energiai_api.service;

import org.springframework.stereotype.Service;
import java.math.RoundingMode;
import java.math.BigDecimal;

@Service
public class CalculoService {
    private static final BigDecimal Tarifa_Herencia = new BigDecimal("0.75");

    public BigDecimal calcularCostoMensual(Integer consumoKwh) {
        if (consumoKwh == null || consumoKwh < 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal consumo = new BigDecimal(consumoKwh);
        return consumo.multiply(Tarifa_Herencia).setScale(2, BigDecimal.ROUND_HALF_UP);
    }
}
