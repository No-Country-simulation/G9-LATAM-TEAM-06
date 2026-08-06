package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.ModeloApiResponse;
import com.hackathon.energiai_api.DTOs.RecomendacionModelo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IntegracionDsServiceTest {

    @Mock
    private WebClient modeloApiWebClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    @InjectMocks
    private IntegracionDsService integracionDsService;

    @Test
    void obtenerPrediccionDs_conModeloDisponible_debeRetornarPrediccionDelModelo() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                400, true, 8, "Residencial", 10,
                4, 120.0f, 3, 6.0f, 380.0f, 30,
                "user1", null, null, null, null
        );

        ModeloApiResponse modeloResponse = new ModeloApiResponse(
                "Ineficiente",
                0.85,
                "avanzado",
                List.of(),
                List.of(new RecomendacionModelo("rec1", "Test", 0.9))
        );

        when(modeloApiWebClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/predict")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(ModeloApiResponse.class)).thenReturn(Mono.just(modeloResponse));

        // When
        IntegracionDsService.PrediccionDs resultado = integracionDsService.obtenerPrediccionDs(request);

        // Then
        assertThat(resultado.categoria()).isEqualTo("Ineficiente");
        assertThat(resultado.probabilidad()).isEqualByComparingTo("0.85");
    }

    @Test
    void obtenerPrediccionDs_conModeloError_debeRetornarFallback() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                400, true, 8, "Residencial", 10,
                4, 120.0f, 3, 6.0f, 380.0f, 30,
                "user1", null, null, null, null
        );

        when(modeloApiWebClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/predict")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(ModeloApiResponse.class)).thenReturn(Mono.error(new RuntimeException("Connection refused")));

        // When
        IntegracionDsService.PrediccionDs resultado = integracionDsService.obtenerPrediccionDs(request);

        // Then: Debe usar fallback (consumo 400 > 350 = Ineficiente)
        assertThat(resultado.categoria()).isEqualTo("Ineficiente");
        assertThat(resultado.probabilidad()).isBetween(BigDecimal.valueOf(0.75), BigDecimal.valueOf(0.95));
    }

    @Test
    void obtenerPrediccionDs_conRequestNull_debeRetornarFallbackModerado() {
        IntegracionDsService.PrediccionDs resultado = integracionDsService.obtenerPrediccionDs(null);
        assertThat(resultado.categoria()).isEqualTo("Moderado");
        assertThat(resultado.probabilidad()).isEqualByComparingTo("0.50");
    }

    @Test
    void fallbackPrediccion_conConsumoBajoYSinPico_debeRetornarEficiente() {
        // Given: consumo 100 < 150, sin pico
        AnalisisRequest request = new AnalisisRequest(
                100, false, 3, "Residencial", 2,
                null, null, null, null, null, null,
                "user1", null, null, null, null
        );

        // When: Llamar método privado via reflection o probar obtenerPrediccionDs con error de modelo
        when(modeloApiWebClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/predict")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(ModeloApiResponse.class)).thenReturn(Mono.error(new RuntimeException("Error")));

        IntegracionDsService.PrediccionDs resultado = integracionDsService.obtenerPrediccionDs(request);

        // Then: consumo 100 < 150 y sin pico = Eficiente
        assertThat(resultado.categoria()).isEqualTo("Eficiente");
    }
}