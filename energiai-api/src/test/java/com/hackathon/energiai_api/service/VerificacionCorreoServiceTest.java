package com.hackathon.energiai_api.service;

import com.hackathon.energiai_api.DTOs.VerificacionResponse;
import com.hackathon.energiai_api.exception.VerificacionCorreoException;
import com.hackathon.energiai_api.model.CodigoVerificacion;
import com.hackathon.energiai_api.model.Usuario;
import com.hackathon.energiai_api.repository.CodigoVerificacionRepository;
import com.hackathon.energiai_api.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificacionCorreoServiceTest {

    @Mock
    private CodigoVerificacionRepository codigoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @Mock
    private JavaMailSender javaMailSender;

    @InjectMocks
    private VerificacionCorreoService servicio;

    @BeforeEach
    void configurarValores() {
        ReflectionTestUtils.setField(servicio, "ttlMinutos", 10L);
        ReflectionTestUtils.setField(servicio, "maxIntentos", 3);
        ReflectionTestUtils.setField(servicio, "limitePorHora", 5L);
        ReflectionTestUtils.setField(servicio, "salt", "test-salt");
        ReflectionTestUtils.setField(servicio, "remitente", "test@energiai.app");
        lenient().when(mailSenderProvider.getIfAvailable()).thenReturn(javaMailSender);
    }

    @Test
    void solicitarCodigo_cuandoHayLugar_debeGenerarEnviarYGuardarCodigo() {
        when(codigoRepository.countByIpOrigenAndCreadoEnAfter(anyString(), any(LocalDateTime.class))).thenReturn(0L);
        when(codigoRepository.findByEmail("persona@correo.com")).thenReturn(Optional.empty());
        when(codigoRepository.save(any(CodigoVerificacion.class))).thenAnswer(inv -> inv.getArgument(0));

        VerificacionResponse respuesta = servicio.solicitarCodigo("Persona@Correo.com", "10.0.0.1");

        assertThat(respuesta.email()).isEqualTo("persona@correo.com");
        assertThat(respuesta.verificado()).isFalse();
        assertThat(respuesta.reintentosRestantes()).isEqualTo(3);
        verify(codigoRepository).save(any(CodigoVerificacion.class));
        verify(javaMailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    void solicitarCodigo_cuandoYaExisteRegistroPrevios_debeActualizarSinInsertar() {
        CodigoVerificacion previo = CodigoVerificacion.builder()
                .id(1L)
                .email("persona@correo.com")
                .codigoHash("hash-anterior")
                .ipOrigen("10.0.0.1")
                .creadoEn(LocalDateTime.now().minusHours(1))
                .expiraEn(LocalDateTime.now().minusMinutes(10))
                .intentos(3)
                .usado(true)
                .build();
        when(codigoRepository.countByIpOrigenAndCreadoEnAfter(anyString(), any(LocalDateTime.class))).thenReturn(0L);
        when(codigoRepository.findByEmail("persona@correo.com")).thenReturn(Optional.of(previo));
        when(codigoRepository.save(any(CodigoVerificacion.class))).thenAnswer(inv -> inv.getArgument(0));

        VerificacionResponse respuesta = servicio.solicitarCodigo("persona@correo.com", "10.0.0.1");

        assertThat(respuesta.verificado()).isFalse();
        assertThat(previo.getUsado()).isFalse();
        assertThat(previo.getIntentos()).isEqualTo(0);
        assertThat(previo.getCodigoHash()).isNotEqualTo("hash-anterior");
        verify(codigoRepository).save(previo);
        verify(javaMailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    void solicitarCodigo_cuandoSuperaRateLimit_debeRechazar() {
        when(codigoRepository.countByIpOrigenAndCreadoEnAfter(eq("10.0.0.1"), any(LocalDateTime.class))).thenReturn(5L);

        assertThatThrownBy(() -> servicio.solicitarCodigo("persona@correo.com", "10.0.0.1"))
                .isInstanceOf(VerificacionCorreoException.class)
                .hasMessageContaining("Demasiadas solicitudes");
        verify(javaMailSender, never()).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    void verificarCodigo_conCodigoCorrecto_debeMarcarVerificado() {
        CodigoVerificacion registro = CodigoVerificacion.builder()
                .id(1L)
                .email("persona@correo.com")
                .codigoHash("x")
                .expiraEn(LocalDateTime.now().plusMinutes(5))
                .intentos(0)
                .usado(false)
                .build();
        when(codigoRepository.findByEmailAndUsadoFalse("persona@correo.com")).thenReturn(Optional.of(registro));
        when(usuarioRepository.findByEmail("persona@correo.com"))
                .thenReturn(Optional.of(Usuario.builder().email("persona@correo.com").verificado(false).build()));

        String codigo = "123456";
        String hash = hashConocido(servicio, "persona@correo.com", codigo);
        registro.setCodigoHash(hash);

        VerificacionResponse respuesta = servicio.verificarCodigo("persona@correo.com", codigo);

        assertThat(respuesta.verificado()).isTrue();
        assertThat(registro.getUsado()).isTrue();
        verify(usuarioRepository).save(argThat(u -> Boolean.TRUE.equals(u.getVerificado())));
    }

    @Test
    void verificarCodigo_conCodigoIncorrecto_debeIncrementarIntentos() {
        CodigoVerificacion registro = CodigoVerificacion.builder()
                .id(1L)
                .email("persona@correo.com")
                .codigoHash("hash-distinto")
                .expiraEn(LocalDateTime.now().plusMinutes(5))
                .intentos(0)
                .usado(false)
                .build();
        when(codigoRepository.findByEmailAndUsadoFalse("persona@correo.com")).thenReturn(Optional.of(registro));
        when(codigoRepository.save(any(CodigoVerificacion.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> servicio.verificarCodigo("persona@correo.com", "000000"))
                .isInstanceOf(VerificacionCorreoException.class)
                .hasMessageContaining("no es correcto");
        assertThat(registro.getIntentos()).isEqualTo(1);
    }

    @Test
    void verificarCodigo_alAgotarIntentos_debeInvalidarCodigo() {
        CodigoVerificacion registro = CodigoVerificacion.builder()
                .id(1L)
                .email("persona@correo.com")
                .codigoHash("hash-distinto")
                .expiraEn(LocalDateTime.now().plusMinutes(5))
                .intentos(2)
                .usado(false)
                .build();
        when(codigoRepository.findByEmailAndUsadoFalse("persona@correo.com")).thenReturn(Optional.of(registro));
        when(codigoRepository.save(any(CodigoVerificacion.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> servicio.verificarCodigo("persona@correo.com", "000000"))
                .isInstanceOf(VerificacionCorreoException.class)
                .hasMessageContaining("Agotaste");
        assertThat(registro.getUsado()).isTrue();
    }

    @Test
    void verificarCodigo_sinCodigoPendiente_debeRechazar() {
        when(codigoRepository.findByEmailAndUsadoFalse("persona@correo.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.verificarCodigo("persona@correo.com", "123456"))
                .isInstanceOf(VerificacionCorreoException.class)
                .hasMessageContaining("No hay un código pendiente");
    }

    private String hashConocido(VerificacionCorreoService servicio, String email, String codigo) {
        // Calcula el hash con el mismo algoritmo y salt configurado en el test.
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(("test-salt:" + email + ":" + codigo).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}