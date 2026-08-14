package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.AnalisisResponse;
import com.hackathon.energiai_api.DTOs.HistorialResponse;
import com.hackathon.energiai_api.DTOs.ModeloApiResponse;
import com.hackathon.energiai_api.DTOs.RecomendacionModelo;
import com.hackathon.energiai_api.exception.ServicioAnalisisException;
import com.hackathon.energiai_api.model.Analisis;
import com.hackathon.energiai_api.repository.AnalisisRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalisisServiceTest {

    @Mock
    private CalculoService calculoService;

    @Mock
    private RecomendacionService recomendacionService;

    @Mock
    private IntegracionDsService integracionDsService;

    @Mock
    private AnalisisRepository analisisRepository;

    @Spy
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @InjectMocks
    private AnalisisService analisisService;

    @Test
    void analizar_conRequestValido_debeGuardarYRetornarResponse() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                4, null, null, null, null, null,
                "user1", null, null, null, null
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(null);
        when(integracionDsService.fallbackPrediccion(any())).thenReturn(
                new IntegracionDsService.PrediccionDs("Moderado", BigDecimal.valueOf(0.60))
        );
        when(calculoService.calcularCostoMensual(250)).thenReturn(BigDecimal.valueOf(187.50));
        when(recomendacionService.generarRecomendaciones(any(), eq(null))).thenReturn(List.of("Test rec"));
        when(analisisRepository.save(any(Analisis.class))).thenAnswer(inv -> {
            Analisis a = inv.getArgument(0);
            a.setId(1L);
            a.setCreadoEn(LocalDateTime.now());
            return a;
        });

        // When
        AnalisisResponse resultado = analisisService.analizar(request);

        // Then
        assertThat(resultado.categoria()).isEqualTo("Moderado");
        assertThat(resultado.costo_estimado_mensual()).isEqualByComparingTo("187.50");
        assertThat(resultado.recomendaciones()).contains("Test rec");
        assertThat(resultado.nivel_analisis()).isEqualTo("parcial");
        assertThat(resultado.campos_imputados()).isEmpty();
        verify(analisisRepository).save(any(Analisis.class));
    }

    @Test
    void analizar_conModeloResponse_debeUsarDatosDelModelo() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                400, true, 8, "Casa", 10,
                4, 120.0f, 3, 6.0f, 380.0f, 30,
                "user1", null, null, null, null
        );

        ModeloApiResponse modeloResponse = new ModeloApiResponse(
                "Ineficiente", 0.85, "avanzado", List.of(),
                List.of(new RecomendacionModelo("rec_model", "Rec del modelo", 0.9))
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(modeloResponse);
        when(calculoService.calcularCostoMensual(400)).thenReturn(BigDecimal.valueOf(300.00));
        when(recomendacionService.generarRecomendaciones(any(), eq(modeloResponse)))
                .thenReturn(List.of("Rec del modelo"));
        when(analisisRepository.save(any(Analisis.class))).thenAnswer(inv -> {
            Analisis a = inv.getArgument(0);
            a.setId(1L);
            a.setCreadoEn(LocalDateTime.now());
            return a;
        });

        // When
        AnalisisResponse resultado = analisisService.analizar(request);

        // Then
        assertThat(resultado.categoria()).isEqualTo("Ineficiente");
        assertThat(resultado.recomendaciones()).contains("Rec del modelo");
    }

    @Test
    void obtenerPorId_conIdExistente_debeRetornarResponse() {
        // Given
        Analisis analisis = Analisis.builder()
                .id(1L)
                .usuarioId("user1")
                .consumoKwh(250)
                .usoHorarioPico(true)
                .cantidadEquipos(5)
                .tipoInmueble("Casa")
                .horasAltoConsumo(6)
                .categoria("Moderado")
                .probabilidad(BigDecimal.valueOf(0.60))
                .costo_estimado_mensual(BigDecimal.valueOf(187.50))
                .creadoEn(LocalDateTime.now())
                .build();

        when(analisisRepository.findById(1L)).thenReturn(Optional.of(analisis));
        when(recomendacionService.generarRecomendaciones(any())).thenReturn(List.of("Test"));

        // When
        AnalisisResponse resultado = analisisService.obtenerPorId(1L);

        // Then
        assertThat(resultado.categoria()).isEqualTo("Moderado");
        assertThat(resultado.costo_estimado_mensual()).isEqualByComparingTo("187.50");
    }

    @Test
    void obtenerPorId_conIdInexistente_debeLanzarExcepcion() {
        when(analisisRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analisisService.obtenerPorId(999L))
                .isInstanceOf(ServicioAnalisisException.class)
                .hasMessageContaining("no encontrado");
    }

    @Test
    void listarPorUsuario_debeRetornarPageHistorialResponse() {
        // Given
        Analisis analisis = Analisis.builder()
                .id(1L)
                .usuarioId("user1")
                .consumoKwh(250)
                .usoHorarioPico(true)
                .cantidadEquipos(5)
                .tipoInmueble("Casa")
                .horasAltoConsumo(6)
                .categoria("Moderado")
                .probabilidad(BigDecimal.valueOf(0.60))
                .costo_estimado_mensual(BigDecimal.valueOf(187.50))
                .creadoEn(LocalDateTime.now())
                .build();

        Page<Analisis> page = new PageImpl<>(List.of(analisis), PageRequest.of(0, 10), 1);
        when(analisisRepository.findByUsuarioId(eq("user1"), any())).thenReturn(page);
        when(recomendacionService.generarRecomendaciones(any())).thenReturn(List.of("Test"));

        // When
        Page<HistorialResponse> resultado = analisisService.listarPorUsuario("user1", null, PageRequest.of(0, 10));

        // Then
        assertThat(resultado.getContent()).hasSize(1);
        HistorialResponse hist = resultado.getContent().get(0);
        assertThat(hist.id()).isEqualTo(1L);
        assertThat(hist.usuario()).isEqualTo("user1");
        assertThat(hist.consumoKwh()).isEqualTo(250);
        assertThat(hist.categoria()).isEqualTo("Moderado");
    }

    @Test
    void borrarHistorialPorUsuario_debeEliminarRegistrosPersistidos() {
        when(analisisRepository.deleteByUsuarioId("usuario@correo.com")).thenReturn(3L);

        long eliminados = analisisService.borrarHistorialPorUsuario(" Usuario@Correo.com ");

        assertThat(eliminados).isEqualTo(3L);
        verify(analisisRepository).deleteByUsuarioId("usuario@correo.com");
    }
}
