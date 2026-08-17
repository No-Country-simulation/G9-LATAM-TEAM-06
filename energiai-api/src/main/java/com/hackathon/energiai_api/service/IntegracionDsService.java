package com.hackathon.energiai_api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.function.Predicate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.hackathon.energiai_api.dtos.AnalisisRequest;
import com.hackathon.energiai_api.dtos.ModeloApiRequest;
import com.hackathon.energiai_api.dtos.ModeloApiResponse;
import com.hackathon.energiai_api.exception.ModeloApiException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.util.retry.Retry;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegracionDsService {

    private final WebClient modeloApiWebClient;

    @Value("${modelo-api.fallback-enabled:true}")
    private boolean fallbackEnabled;

    /** Reintentos ante fallas transitorias (5xx, timeout, conexión). No reintenta errores 4xx. */
    private static final int REINTENTOS_MAX = 2;
    private static final Duration BACKOFF_INICIAL = Duration.ofMillis(500);
    private static final Duration BACKOFF_MAXIMO = Duration.ofSeconds(3);

    public record PrediccionDs(String categoria, BigDecimal probabilidad) {
    }

    /** Acota la probabilidad de terceros al rango válido [0, 1]. */
    static BigDecimal probabilidadAcotada(Double probabilidad) {
        double valor = probabilidad != null ? probabilidad : 0.5;
        return BigDecimal.valueOf(Math.min(1.0, Math.max(0.0, valor)))
                .setScale(2, RoundingMode.HALF_UP);
    }

    public PrediccionDs obtenerPrediccionDs(AnalisisRequest request) {
        ModeloApiResponse response = obtenerRespuestaCompleta(request);
        if (response != null && response.categoria() != null) {
            return new PrediccionDs(response.categoria(), probabilidadAcotada(response.probabilidad()));
        }
        return fallbackPrediccion(request);
    }

    public ModeloApiResponse obtenerRespuestaCompleta(AnalisisRequest request) {
        if (request == null) {
            return null;
        }

        ModeloApiRequest modeloRequest = buildModeloRequest(request);
        ModeloApiResponse response = null;

        try {
            response = modeloApiWebClient.post()
                    .uri("/predict")
                    .bodyValue(modeloRequest)
                    .retrieve()
                    .bodyToMono(ModeloApiResponse.class)
                    .retryWhen(Retry.backoff(REINTENTOS_MAX, BACKOFF_INICIAL)
                            .maxBackoff(BACKOFF_MAXIMO)
                            .filter(errorReintentable())
                            .onRetryExhaustedThrow((spec, signal) -> signal.failure()))
                    .doOnError(error -> log.warn(
                            "Falló la llamada a modelo-api tras {} reintentos: {}", REINTENTOS_MAX, error.getMessage()))
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Error HTTP llamando a modelo-api: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (!fallbackEnabled) {
                throw new ModeloApiException("El servicio de modelos no está disponible", e);
            }
        } catch (Exception e) {
            log.error("Error llamando a modelo-api: {}", e.getMessage());
            if (!fallbackEnabled) {
                throw new ModeloApiException("El servicio de modelos no está disponible", e);
            }
        }

        if (response != null && response.categoria() != null) {
            log.info("Predicción recibida del modelo: {} ({})", response.categoria(), response.probabilidad());
            return response;
        }

        if (!fallbackEnabled) {
            throw new ModeloApiException("El servicio de modelos no devolvió una categoría válida");
        }
        return null;
    }

    /** Solo reintenta fallas transitorias: errores 5xx, timeout y de conexión. Un 4xx es definitivo. */
    private static Predicate<Throwable> errorReintentable() {
        return error -> !(error instanceof WebClientResponseException ex
                && ex.getStatusCode().is4xxClientError());
    }

    private ModeloApiRequest buildModeloRequest(AnalisisRequest request) {
        return new ModeloApiRequest(
                request.consumo_kwh(),
                request.uso_horario_pico(),
                request.cantidad_equipos(),
                request.tipo_inmueble(),
                request.horas_alto_consumo(),
                request.cantidad_personas(),
                request.area_m2() != null ? request.area_m2().doubleValue() : null,
                request.equiposAltoResueltos(),
                request.equiposMedioResueltos(),
                request.equiposBajoResueltos(),
                request.horas_aire_acondicionado() != null ? request.horas_aire_acondicionado().intValue() : null,
                request.consumo_mes_anterior_kwh() != null ? request.consumo_mes_anterior_kwh().doubleValue() : null,
                request.dias_facturados()
        );
    }

    private PrediccionDs fallbackPrediccion() {
        return new PrediccionDs("Moderado", BigDecimal.valueOf(0.50));
    }

    public PrediccionDs fallbackPrediccion(AnalisisRequest request) {
        if (request == null) {
            return fallbackPrediccion();
        }
        String categoria;
        double probabilidadFija;

        if (request.consumo_kwh() > UmbralesModelo.CONSUMO_INEFICIENTE
                || (request.horas_alto_consumo() >= UmbralesModelo.HORAS_ALTO_CONSUMO_CLASIFICACION
                && Boolean.TRUE.equals(request.uso_horario_pico()))) {
            categoria = "Ineficiente";
            probabilidadFija = 0.80;
        } else if (request.consumo_kwh() < UmbralesModelo.CONSUMO_EFICIENTE && Boolean.FALSE.equals(request.uso_horario_pico())) {
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
