package com.hackathon.energiai_api.controllers;

import com.hackathon.energiai_api.dtos.AnalisisRequest;
import com.hackathon.energiai_api.dtos.AnalisisResponse;
import com.hackathon.energiai_api.filter.ApiKeyAuthenticationFilter;
import com.hackathon.energiai_api.service.AnalisisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AnalisisControllerWebMvcTest {

    @Mock
    private AnalisisService analisisService;

    @InjectMocks
    private AnalisisController analisisController;

    private MockMvc mockMvc;

    private static final String API_KEY_VALIDA = "clave-de-prueba";
    private static final String USUARIO_VALIDO = "usuario@correo.com";

    @BeforeEach
    void configurarMockMvc() {
        ApiKeyAuthenticationFilter filtro = new ApiKeyAuthenticationFilter();
        ReflectionTestUtils.setField(filtro, "apiKeySecret", API_KEY_VALIDA);
        ReflectionTestUtils.setField(filtro, "apiKeySecretFile", "");
        mockMvc = MockMvcBuilders.standaloneSetup(analisisController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .addFilters(filtro)
                .build();
    }

    @Test
    void analizarConsumo_casoExitoso_debeRetornar201() throws Exception {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                4, null, null, null, null, null,
                USUARIO_VALIDO, null, null, 2, 1, 2
        );

        when(analisisService.analizar(any())).thenReturn(new AnalisisResponse(
                "Moderado", BigDecimal.valueOf(0.60),
                List.of("Test rec"),
                BigDecimal.valueOf(187.50),
                Map.of("alto", 0, "medio", 0, "bajo", 0),
                "parcial", List.of(), List.of(),
                "modelo_ml", "1.0.0", List.of(),
                null
        ));

        // When/Then
        mockMvc.perform(post("/analisis-energetico")
                .header("X-API-KEY", API_KEY_VALIDA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(asJsonString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoria").value("Moderado"))
                .andExpect(jsonPath("$.costo_estimado_mensual").value("187.5"));
    }

    @Test
    void analizarConsumo_sinAPIKey_debeRetornar401() throws Exception {
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                4, null, null, null, null, null,
                USUARIO_VALIDO, null, null, 2, 1, 2
        );

        // When/Then
        mockMvc.perform(post("/analisis-energetico")
                .contentType(MediaType.APPLICATION_JSON)
                .content(asJsonString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void obtenerAnalisis_casoExitoso_debeRetornar200() throws Exception {
        when(analisisService.obtenerPorId(1L)).thenReturn(new AnalisisResponse(
                "Moderado", BigDecimal.valueOf(0.60),
                List.of(), BigDecimal.valueOf(187.50),
                Map.of("alto", 0, "medio", 0, "bajo", 0),
                "parcial", List.of(), List.of(),
                "modelo_ml", "1.0.0", List.of(),
                null
        ));

        // When/Then
        mockMvc.perform(get("/analisis-energetico/1")
                .header("X-API-KEY", API_KEY_VALIDA)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoria").value("Moderado"));
    }

    @Test
    void listarAnalisis_casoExitoso_debeRetornar200() throws Exception {
        when(analisisService.listarPorUsuario(eq(USUARIO_VALIDO), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        // When/Then
        mockMvc.perform(get("/analisis-energetico")
                .header("X-API-KEY", API_KEY_VALIDA)
                .param("usuarioId", USUARIO_VALIDO)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // Helper method to convert object to JSON
    private String asJsonString(final Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}