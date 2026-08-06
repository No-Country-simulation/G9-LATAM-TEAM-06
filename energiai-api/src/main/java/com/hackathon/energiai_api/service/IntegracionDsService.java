package com.hackathon.energiai_api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.ModeloApiRequest;
import com.hackathon.energiai_api.DTOs.ModeloApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegracionDsService {

    private final WebClient modeloApiWebClient;

    @Value("${modelo-api.fallback-enabled:true}")
    private boolean fallbackEnabled;

    public record PrediccionDs(String categoria, BigDecimal probabilidad) {
    }

    private static final int UMBRAL_CONSUMO_INEFICIENTE = 350;
    private static final int UMBRAL_HORAS_ALTO_CONSUMO = 8;
    private static final int UMBRAL_CONSUMO_EFICIENTE = 150;

    public PrediccionDs obtenerPrediccionDs(AnalisisRequest request) {
        ModeloApiResponse response = obtenerRespuestaCompleta(request);
        if (response != null && response.categoria() != null) {
            BigDecimal probabilidad = BigDecimal.valueOf(response.probabilidad() != null ? response.probabilidad() : 0.5)
                    .setScale(2, RoundingMode.HALF_UP);
            return new PrediccionDs(response.categoria(), probabilidad);
        }
        return fallbackPrediccion(request);
    }

    public ModeloApiResponse obtenerRespuestaCompleta(AnalisisRequest request) {
        if (request == null) {
            return null;
        }

        ModeloApiRequest modeloRequest = buildModeloRequest(request);

        try {
            ModeloApiResponse response = modeloApiWebClient.post()
                    .uri("/predict")
                    .bodyValue(modeloRequest)
                    .retrieve()
                    .bodyToMono(ModeloApiResponse.class)
                    .block();

            if (response != null && response.categoria() != null) {
                log.info("Predicción recibida del modelo: {} ({})", response.categoria(), response.probabilidad());
                return response;
            }
        } catch (WebClientResponseException e) {
            log.error("Error HTTP llamando a modelo-api: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Error llamando a modelo-api: {}", e.getMessage());
        }

        return null;
    }

    private ModeloApiRequest buildModeloRequest(AnalisisRequest request) {
        return new ModeloApiRequest(
                request.consumo_kwh() != null ? request.consumo_kwh().doubleValue() : null,
                request.uso_horario_pico(),
                request.cantidad_equipos(),
                request.tipo_inmueble(),
                request.horas_alto_consumo() != null ? request.horas_alto_consumo().doubleValue() : null,
                request.cantidad_personas(),
                request.area_m2() != null ? request.area_m2().doubleValue() : null,
                request.equipos_alto_consumo(),
                request.horas_aire_acondicionado() != null ? request.horas_aire_acondicionado().doubleValue() : null,
                request.consumo_mes_anterior_kwh() != null ? request.consumo_mes_anterior_kwh().doubleValue() : null,
                request.dias_facturados()
        );
    }

    private PrediccionDs fallbackPrediccion() {
        return new PrediccionDs("Moderado", BigDecimal.valueOf(0.50));
    }

    private PrediccionDs fallbackPrediccion(AnalisisRequest request) {
        if (request == null) {
            return fallbackPrediccion();
        }
        String categoria;
        double probabilidadFija;

        if (request.consumo_kwh() > UMBRAL_CONSUMO_INEFICIENTE
                || (request.horas_alto_consumo() >= UMBRAL_HORAS_ALTO_CONSUMO && Boolean.TRUE.equals(request.uso_horario_pico()))) {
            categoria = "Ineficiente";
            probabilidadFija = 0.80;
        } else if (request.consumo_kwh() < UMBRAL_CONSUMO_EFICIENTE && Boolean.FALSE.equals(request.uso_horario_pico())) {
            categoria = "Eficiente";
            probabilidadFija = 0.85;
        } else {
            categoria = "Moderado";
            probabilidadFija = 0.65;
        }
        BigDecimal probabilidad = BigDecimal.valueOf(probabilidadFija).setScale(2, RoundingMode.HALF_UP);
        return new PrediccionDs(categoria, probabilidad);
    }
}