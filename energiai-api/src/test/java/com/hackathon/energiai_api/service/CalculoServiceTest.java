package com.hackathon.energiai_api.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalculoServiceTest {

    @InjectMocks
    private CalculoService calculoService;

    @Test
    void calcularCostoMensual_conConsumoValido_debeRetornarCostoCorrecto() {
        // Given: tarifa 0.75 BRL/kWh (hardcoded en servicio)
        Integer consumoKwh = 100;

        // When
        BigDecimal costo = calculoService.calcularCostoMensual(consumoKwh);

        // Then: 100 * 0.75 = 75.00
        assertThat(costo).isEqualByComparingTo("75.00");
    }

    @Test
    void calcularCostoMensual_conConsumoCero_debeRetornarCero() {
        BigDecimal costo = calculoService.calcularCostoMensual(0);
        assertThat(costo).isEqualByComparingTo("0.00");
    }

    @Test
    void calcularCostoMensual_conConsumoAlto_debeCalcularCorrectamente() {
        BigDecimal costo = calculoService.calcularCostoMensual(1000);
        assertThat(costo).isEqualByComparingTo("750.00");
    }

    @Test
    void calcularCostoMensual_conConsumoDecimal_debeRedondearDosDecimales() {
        BigDecimal costo = calculoService.calcularCostoMensual(133);
        // 133 * 0.75 = 99.75
        assertThat(costo).isEqualByComparingTo("99.75");
    }
}