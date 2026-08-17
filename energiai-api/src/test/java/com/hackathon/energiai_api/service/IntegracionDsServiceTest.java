package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.dtos.AnalisisRequest;
import com.hackathon.energiai_api.dtos.ModeloApiRequest;
import com.hackathon.energiai_api.dtos.ModeloApiResponse;
import com.hackathon.energiai_api.dtos.RecomendacionModelo;
import com.hackathon.energiai_api.exception.ModeloApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
                400, true, 8, "Casa", 10,
                4, 120.0f, 3, 6.0f, 380.0f, 30,
                "user1", null, null, null, null, null
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
    void obtenerRespuestaCompleta_debeEnviarLaDistribucionCompletaDeEquipos() {
        AnalisisRequest request = new AnalisisRequest(
                400, false, 10, "Casa", 4,
                null, null, 0, null, null, null,
                "user1", null, null, 0, 4, 6
        );
        ModeloApiResponse modeloResponse = new ModeloApiResponse(
                "Moderado", 0.75, "basico", List.of(), List.of()
        );

        when(modeloApiWebClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/predict")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(ModeloApiResponse.class)).thenReturn(Mono.just(modeloResponse));

        integracionDsService.obtenerRespuestaCompleta(request);

        ArgumentCaptor<ModeloApiRequest> captor = ArgumentCaptor.forClass(ModeloApiRequest.class);
        verify(requestBodySpec).bodyValue(captor.capture());
        assertThat(captor.getValue().equiposAltoConsumo()).isZero();
        assertThat(captor.getValue().equiposMedioConsumo()).isEqualTo(4);
        assertThat(captor.getValue().equiposBajoConsumo()).isEqualTo(6);
    }

    @Test
    void obtenerPrediccionDs_conModeloError_debeRetornarFallback() {
        // Given
        ReflectionTestUtils.setField(integracionDsService, "fallbackEnabled", true);
        AnalisisRequest request = new AnalisisRequest(
                900, true, 8, "Casa", 10,
                4, 120.0f, 3, 6.0f, 380.0f, 30,
                "user1", null, null, null, null, null
        );

        when(modeloApiWebClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/predict")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(ModeloApiResponse.class)).thenReturn(Mono.error(new RuntimeException("Connection refused")));

        // When
        IntegracionDsService.PrediccionDs resultado = integracionDsService.obtenerPrediccionDs(request);

        // Then: Debe usar fallback (consumo 900 > 800 = Ineficiente)
        assertThat(resultado.categoria()).isEqualTo("Ineficiente");
        assertThat(resultado.probabilidad()).isBetween(BigDecimal.valueOf(0.75), BigDecimal.valueOf(0.95));
    }

    @Test
    void obtenerPrediccionDs_conModeloErrorYFallbackDeshabilitado_debeLanzarExcepcion() {
        // Given: fallback deshabilitado (producción)
        ReflectionTestUtils.setField(integracionDsService, "fallbackEnabled", false);
        AnalisisRequest request = new AnalisisRequest(
                900, true, 8, "Casa", 10,
                4, 120.0f, 3, 6.0f, 380.0f, 30,
                "user1", null, null, null, null, null
        );

        when(modeloApiWebClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/predict")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(ModeloApiResponse.class)).thenReturn(Mono.error(new RuntimeException("Connection refused")));

        // When/Then: Debe lanzar excepción, no usar reglas de respaldo
        assertThatThrownBy(() -> integracionDsService.obtenerPrediccionDs(request))
                .isInstanceOf(ModeloApiException.class);
    }

    @Test
    void obtenerPrediccionDs_conRequestNull_debeRetornarFallbackModerado() {
        ReflectionTestUtils.setField(integracionDsService, "fallbackEnabled", true);
        IntegracionDsService.PrediccionDs resultado = integracionDsService.obtenerPrediccionDs(null);
        assertThat(resultado.categoria()).isEqualTo("Moderado");
        assertThat(resultado.probabilidad()).isEqualByComparingTo("0.50");
    }

    @Test
    void fallbackPrediccion_conConsumoBajoYSinPico_debeRetornarEficiente() {
        // Given: consumo 100 < 150, sin pico
        ReflectionTestUtils.setField(integracionDsService, "fallbackEnabled", true);
        AnalisisRequest request = new AnalisisRequest(
                200, false, 3, "Casa", 2,
                null, null, null, null, null, null,
                "user1", null, null, null, null, null
        );

        // When: Llamar método privado via reflection o probar obtenerPrediccionDs con error de modelo
        when(modeloApiWebClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri("/predict")).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(ModeloApiResponse.class)).thenReturn(Mono.error(new RuntimeException("Error")));

        IntegracionDsService.PrediccionDs resultado = integracionDsService.obtenerPrediccionDs(request);

        // Then: consumo 200 < 300 y sin pico = Eficiente
        assertThat(resultado.categoria()).isEqualTo("Eficiente");
    }
}
