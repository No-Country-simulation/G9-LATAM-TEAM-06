package com.hackathon.energiai_api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

@Service
public class CalculoService {
    private static final BigDecimal TARIFA_REFERENCIA = new BigDecimal("0.75");

    public BigDecimal calcularCostoMensual(Integer consumoKwh) {
        if (consumoKwh == null || consumoKwh < 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal consumo = new BigDecimal(consumoKwh);
        return consumo.multiply(TARIFA_REFERENCIA).setScale(2, RoundingMode.HALF_UP);
    }
}
