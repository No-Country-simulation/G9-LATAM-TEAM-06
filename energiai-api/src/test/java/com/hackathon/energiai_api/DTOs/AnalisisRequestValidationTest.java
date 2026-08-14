package com.hackathon.energiai_api.DTOs;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AnalisisRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void configurarValidador() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void casa_conValoresDentroDelDominio_esValida() {
        AnalisisRequest request = request(250, 8, "Casa", 4, 100f, 2, 2, 3, 3);

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void comercio_conConsumoBajoDentroDelRangoGeneral_esValido() {
        AnalisisRequest request = request(250, 10, "Comercio", 5, 100f, 2, 2, 4, 4);

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void distribucionQueNoSumaEquipos_esInvalida() {
        AnalisisRequest request = request(250, 8, "Casa", 4, 100f, 1, 1, 1, 1);

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getMessage().contains("distribución"));
    }

    @Test
    void areaFueraDelRangoDeApartamento_esInvalida() {
        AnalisisRequest request = request(300, 8, "Apartamento", 4, 200f, 2, 2, 3, 3);

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getMessage().contains("rango entrenado"));
    }

    @Test
    void oficina_conConsumoDeCincoMil_esValida() {
        AnalisisRequest request = request(5000, 10, "Oficina", 12, 300f, 3, 3, 4, 3);

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void horasDeAltoConsumo_aceptaVeinticuatroYRechazaVeinticinco() {
        AnalisisRequest valido = request(1200, 10, "Oficina", 12, 300f, 3, 3, 4, 3, 24);
        AnalisisRequest invalido = request(1200, 10, "Oficina", 12, 300f, 3, 3, 4, 3, 25);

        assertThat(validator.validate(valido)).isEmpty();
        assertThat(validator.validate(invalido))
                .anyMatch(error -> error.getMessage().contains("superar 24"));
    }

    @Test
    void equiposDeAltoConsumoMayoresAlTotal_esInvalido() {
        AnalisisRequest request = request(1200, 20, "Comercio", 8, 250f, 21, 10, 5, 5);

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getMessage().contains("superar el total"));
    }

    @Test
    void precisionMayorADosDecimales_esInvalida() {
        AnalisisRequest request = new AnalisisRequest(
                250, false, 8, "Casa", 4,
                4, 100.123f, 2, 2.5f, 220.123f, 30,
                "persona@example.com", null, 2, 3, 3
        );

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getMessage().contains("máximo 2 decimales"));
    }

    @Test
    void distribucionManualParcial_esInvalida() {
        AnalisisRequest request = new AnalisisRequest(
                250, false, 8, "Casa", 4,
                4, 100f, 2, 2f, 220f, 30,
                "persona@example.com", null, 2, null, 6
        );

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getMessage().contains("completa"));
    }

    @Test
    void mapaConElectrodomesticoDesconocido_esInvalido() {
        Map<String, Integer> mapa = new LinkedHashMap<>();
        mapa.put("equipo_inventado", 8);
        AnalisisRequest request = new AnalisisRequest(
                250, false, 8, "Casa", 4,
                4, 100f, null, 2f, 220f, 30,
                "persona@example.com", mapa, null, null, null
        );

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getMessage().contains("catálogo"));
    }

    @Test
    void mapaYDistribucionManualContradictorios_sonInvalidos() {
        Map<String, Integer> mapa = Map.of("aire_acondicionado", 2, "nevera", 6);
        AnalisisRequest request = new AnalisisRequest(
                250, false, 8, "Casa", 4,
                4, 100f, 1, 2f, 220f, 30,
                "persona@example.com", mapa, 1, 1, 6
        );

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getMessage().contains("distribución"));
    }

    @Test
    void correoConDominioIncompleto_esInvalido() {
        AnalisisRequest validoExceptoCorreo = new AnalisisRequest(
                250, false, 8, "Casa", 4,
                4, 100f, 2, 2f, 220f, 30,
                "persona@localhost", null, 2, 3, 3
        );

        assertThat(validator.validate(validoExceptoCorreo))
                .anyMatch(error -> error.getMessage().contains("correo válido"));
    }

    private AnalisisRequest request(
            int consumo,
            int equipos,
            String tipo,
            int personas,
            float area,
            int alto,
            int distribucionAlto,
            int medio,
            int bajo) {
        return request(consumo, equipos, tipo, personas, area, alto, distribucionAlto, medio, bajo, 4);
    }

    private AnalisisRequest request(
            int consumo,
            int equipos,
            String tipo,
            int personas,
            float area,
            int alto,
            int distribucionAlto,
            int medio,
            int bajo,
            int horasAltoConsumo) {
        return new AnalisisRequest(
                consumo,
                false,
                equipos,
                tipo,
                horasAltoConsumo,
                personas,
                area,
                alto,
                2f,
                null,
                30,
                "persona@example.com",
                null,
                distribucionAlto,
                medio,
                bajo
        );
    }
}
