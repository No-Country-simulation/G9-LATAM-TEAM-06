package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.dtos.AnalisisRequest;
import com.hackathon.energiai_api.dtos.AnalisisResponse;
import com.hackathon.energiai_api.dtos.HistorialResponse;
import com.hackathon.energiai_api.dtos.ModeloApiResponse;
import com.hackathon.energiai_api.dtos.RecomendacionModelo;
import com.hackathon.energiai_api.exception.ServicioAnalisisException;
import com.hackathon.energiai_api.model.Analisis;
import com.hackathon.energiai_api.model.Usuario;
import com.hackathon.energiai_api.repository.AnalisisRepository;
import com.hackathon.energiai_api.repository.UsuarioRepository;
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

    @Mock
    private UsuarioRepository usuarioRepository;

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
                "user1", null, null, null, null, null
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(null);
        when(integracionDsService.fallbackPrediccion(any())).thenReturn(
                new IntegracionDsService.PrediccionDs("Moderado", BigDecimal.valueOf(0.60))
        );
        when(calculoService.calcularCostoMensual(250)).thenReturn(BigDecimal.valueOf(187.50));
        when(recomendacionService.generarRecomendaciones(any(), eq(null))).thenReturn(List.of("Test rec"));
        when(usuarioRepository.findByEmail("user1")).thenReturn(Optional.of(usuarioVerificado("user1")));
        when(usuarioRepository.incrementarContador(any())).thenReturn(1);
        when(usuarioRepository.obtenerContadorAnalisis(any())).thenReturn(1);
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
        assertThat(resultado.nombre_o_numero_analisis()).isEqualTo("Análisis 1");
        verify(analisisRepository).save(any(Analisis.class));
    }

    @Test
    void analizar_sinNombre_debeAsignarNumeracionCorrelativaPorUsuario() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                4, null, null, null, null, null,
                "persona@correo.com", null, null, null, null, null
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(null);
        when(integracionDsService.fallbackPrediccion(any())).thenReturn(
                new IntegracionDsService.PrediccionDs("Eficiente", BigDecimal.valueOf(0.80))
        );
        when(calculoService.calcularCostoMensual(250)).thenReturn(BigDecimal.valueOf(187.50));
        when(recomendacionService.generarRecomendaciones(any(), eq(null))).thenReturn(List.of());
        when(usuarioRepository.findByEmail("persona@correo.com")).thenReturn(Optional.of(usuarioVerificado("persona@correo.com")));
        when(usuarioRepository.incrementarContador(any())).thenReturn(4);
        when(usuarioRepository.obtenerContadorAnalisis(any())).thenReturn(4);
        when(analisisRepository.save(any(Analisis.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        AnalisisResponse resultado = analisisService.analizar(request);

        // Then
        assertThat(resultado.nombre_o_numero_analisis()).isEqualTo("Análisis 4");
        verify(usuarioRepository).incrementarContador(any());
        verify(usuarioRepository).obtenerContadorAnalisis(any());
    }

    @Test
    void analizar_conNombrePersonalizado_debeUsarElNombreIndicado() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                4, null, null, null, null, null,
                "persona@correo.com", "Mi consumo de julio", null, null, null, null
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(null);
        when(integracionDsService.fallbackPrediccion(any())).thenReturn(
                new IntegracionDsService.PrediccionDs("Eficiente", BigDecimal.valueOf(0.80))
        );
        when(calculoService.calcularCostoMensual(250)).thenReturn(BigDecimal.valueOf(187.50));
        when(recomendacionService.generarRecomendaciones(any(), eq(null))).thenReturn(List.of());
        when(usuarioRepository.findByEmail("persona@correo.com")).thenReturn(Optional.of(usuarioVerificado("persona@correo.com")));
        when(usuarioRepository.incrementarContador(any())).thenReturn(0);
        when(usuarioRepository.obtenerContadorAnalisis(any())).thenReturn(1);
        when(analisisRepository.save(any(Analisis.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        AnalisisResponse resultado = analisisService.analizar(request);

        // Then
        assertThat(resultado.nombre_o_numero_analisis()).isEqualTo("Mi consumo de julio");
    }

    @Test
    void analizar_conModeloResponse_debeUsarDatosDelModelo() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                400, true, 8, "Casa", 10,
                4, 120.0f, 3, 6.0f, 380.0f, 30,
                "user1", null, null, null, null, null
        );

        ModeloApiResponse modeloResponse = new ModeloApiResponse(
                "Ineficiente", 0.85, "avanzado", List.of(),
                List.of(new RecomendacionModelo("rec_model", "Rec del modelo", 0.9))
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(modeloResponse);
        when(calculoService.calcularCostoMensual(400)).thenReturn(BigDecimal.valueOf(300.00));
        when(recomendacionService.generarRecomendaciones(any(), eq(modeloResponse)))
                .thenReturn(List.of("Rec del modelo"));
        when(usuarioRepository.findByEmail("user1")).thenReturn(Optional.of(usuarioVerificado("user1")));
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
    void analizar_conProbabilidadDelModeloFueraDeRango_debeAcotarlaAlUno() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                400, true, 8, "Casa", 10,
                4, 120.0f, 3, 6.0f, 380.0f, 30,
                "user1", null, null, null, null, null
        );

        ModeloApiResponse modeloResponse = new ModeloApiResponse(
                "Ineficiente", 1.75, "avanzado", List.of(), List.of()
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(modeloResponse);
        when(calculoService.calcularCostoMensual(400)).thenReturn(BigDecimal.valueOf(300.00));
        when(recomendacionService.generarRecomendaciones(any(), eq(modeloResponse))).thenReturn(List.of());
        when(usuarioRepository.findByEmail("user1")).thenReturn(Optional.of(usuarioVerificado("user1")));
        when(analisisRepository.save(any(Analisis.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        AnalisisResponse resultado = analisisService.analizar(request);

        // Then
        assertThat(resultado.probabilidad()).isEqualByComparingTo("1.00");
    }

    @Test
    void analizar_sinNombre_debeConsumirElContadorCorrelativo() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                4, null, null, null, null, null,
                "user1", null, null, null, null, null
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(null);
        when(integracionDsService.fallbackPrediccion(any())).thenReturn(
                new IntegracionDsService.PrediccionDs("Moderado", BigDecimal.valueOf(0.60))
        );
        when(calculoService.calcularCostoMensual(250)).thenReturn(BigDecimal.valueOf(187.50));
        when(recomendacionService.generarRecomendaciones(any(), eq(null))).thenReturn(List.of());
        when(usuarioRepository.findByEmail("user1")).thenReturn(Optional.of(usuarioVerificado("user1")));
        when(usuarioRepository.obtenerContadorAnalisis(any())).thenReturn(7);
        when(analisisRepository.save(any(Analisis.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        AnalisisResponse resultado = analisisService.analizar(request);

        // Then
        assertThat(resultado.nombre_o_numero_analisis()).isEqualTo("Análisis 7");
        verify(usuarioRepository).incrementarContador(any());
        verify(usuarioRepository).obtenerContadorAnalisis(any());
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
                .nombreONumeroAnalisis("Análisis 1")
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
        assertThat(hist.nombre_o_numero_analisis()).isEqualTo("Análisis 1");
    }

    @Test
    void borrarHistorialPorUsuario_debeEliminarRegistrosPersistidos() {
        when(analisisRepository.deleteByUsuarioId("usuario@correo.com")).thenReturn(3L);
        when(usuarioRepository.findByEmail("usuario@correo.com")).thenReturn(
                Optional.of(usuarioVerificado("usuario@correo.com")));

        long eliminados = analisisService.borrarHistorialPorUsuario(" Usuario@Correo.com ");

        assertThat(eliminados).isEqualTo(3L);
        verify(analisisRepository).deleteByUsuarioId("usuario@correo.com");
        verify(usuarioRepository).resetearContador(any());
    }

    @Test
    void borrarHistorialPorUsuario_sinRegistros_noReiniciaContador() {
        when(analisisRepository.deleteByUsuarioId("usuario@correo.com")).thenReturn(0L);

        long eliminados = analisisService.borrarHistorialPorUsuario("usuario@correo.com");

        assertThat(eliminados).isZero();
        verify(usuarioRepository, never()).resetearContador(any());
    }

    @Test
    void analizar_comoInvitado_debeCalcularSinPersistirEnBD() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                4, null, null, null, null, null,
                "invitado", null, null, null, null, null
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(null);
        when(integracionDsService.fallbackPrediccion(any())).thenReturn(
                new IntegracionDsService.PrediccionDs("Moderado", BigDecimal.valueOf(0.60))
        );
        when(calculoService.calcularCostoMensual(250)).thenReturn(BigDecimal.valueOf(187.50));
        when(recomendacionService.generarRecomendaciones(any(), eq(null))).thenReturn(List.of("Test rec"));

        // When
        AnalisisResponse resultado = analisisService.analizar(request);

        // Then
        assertThat(resultado.categoria()).isEqualTo("Moderado");
        assertThat(resultado.nombre_o_numero_analisis()).isNull();
        verify(analisisRepository, never()).save(any(Analisis.class));
        verify(usuarioRepository, never()).incrementarContador(any());
    }

    @Test
    void analizar_conCorreoNoVerificado_debeRechazarse() {
        // Given
        AnalisisRequest request = new AnalisisRequest(
                250, true, 5, "Casa", 6,
                4, null, null, null, null, null,
                "persona@correo.com", null, null, null, null, null
        );

        when(integracionDsService.obtenerRespuestaCompleta(any())).thenReturn(null);
        when(integracionDsService.fallbackPrediccion(any())).thenReturn(
                new IntegracionDsService.PrediccionDs("Moderado", BigDecimal.valueOf(0.60))
        );
        when(calculoService.calcularCostoMensual(250)).thenReturn(BigDecimal.valueOf(187.50));
        when(recomendacionService.generarRecomendaciones(any(), eq(null))).thenReturn(List.of());
        when(usuarioRepository.findByEmail("persona@correo.com"))
                .thenReturn(Optional.of(Usuario.builder().email("persona@correo.com").verificado(false).build()));

        // When / Then
        assertThatThrownBy(() -> analisisService.analizar(request))
                .isInstanceOf(com.hackathon.energiai_api.exception.VerificacionCorreoException.class)
                .hasMessageContaining("verificar");
        verify(analisisRepository, never()).save(any(Analisis.class));
    }

    private Usuario usuarioVerificado(String email) {
        return Usuario.builder().id(1L).email(email).verificado(true).build();
    }
}
