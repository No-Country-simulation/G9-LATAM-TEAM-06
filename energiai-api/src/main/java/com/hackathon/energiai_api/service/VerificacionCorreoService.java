package com.hackathon.energiai_api.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hackathon.energiai_api.dtos.VerificacionResponse;
import com.hackathon.energiai_api.exception.VerificacionCorreoException;
import com.hackathon.energiai_api.model.CodigoVerificacion;
import com.hackathon.energiai_api.model.Usuario;
import com.hackathon.energiai_api.repository.CodigoVerificacionRepository;
import com.hackathon.energiai_api.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VerificacionCorreoService {

    private static final Logger logger = LoggerFactory.getLogger(VerificacionCorreoService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int TAMANO_CODIGO = 6;

    private final CodigoVerificacionRepository codigoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${verificacion.codigo.ttl-minutos:10}")
    private long ttlMinutos;

    @Value("${verificacion.codigo.max-intentos:3}")
    private int maxIntentos;

    @Value("${verificacion.rate-limit.por-hora:5}")
    private long limitePorHora;

    @Value("${verificacion.codigo.salt:energiai-verificacion-2026}")
    private String salt;

    @Value("${spring.mail.from:no-responder@energiai.app}")
    private String remitente;

    @Transactional
    public VerificacionResponse solicitarCodigo(String email, String ipOrigen) {
        String normalizado = normalizarCorreo(email);
        String ip = ipOrigen != null && !ipOrigen.isBlank() ? ipOrigen : "desconocida";

        validarRateLimit(ip);

        String codigo = generarCodigo();
        String hash = hashCodigo(normalizado, codigo);

        LocalDateTime ahora = LocalDateTime.now();
        CodigoVerificacion registro = codigoRepository.findByEmail(normalizado)
                .orElseGet(() -> CodigoVerificacion.builder()
                        .email(normalizado)
                        .build());
        registro.setCodigoHash(hash);
        registro.setIpOrigen(ip);
        registro.setCreadoEn(ahora);
        registro.setExpiraEn(ahora.plusMinutes(ttlMinutos));
        registro.setIntentos(0);
        registro.setUsado(false);
        codigoRepository.save(registro);

        enviarCorreo(normalizado, codigo);

        logger.info("Código de verificación enviado a {} desde IP {}", normalizado, ip);
        return new VerificacionResponse(normalizado, false, "Código enviado. Revisa tu correo.", maxIntentos);
    }

    @Transactional
    public VerificacionResponse verificarCodigo(String email, String codigo) {
        String normalizado = normalizarCorreo(email);

        CodigoVerificacion registro = codigoRepository.findByEmailAndUsadoFalse(normalizado)
                .orElseThrow(() -> new VerificacionCorreoException(
                        "CODIGO_NO_ENCONTRADO",
                        "No hay un código pendiente para este correo. Solicita uno nuevo.",
                        HttpStatus.BAD_REQUEST));

        if (registro.getExpiraEn().isBefore(LocalDateTime.now())) {
            invalidar(registro);
            throw new VerificacionCorreoException(
                    "CODIGO_EXPIRADO",
                    "El código expiró. Solicita uno nuevo.",
                    HttpStatus.BAD_REQUEST);
        }

        if (registro.getIntentos() >= maxIntentos) {
            invalidar(registro);
            throw new VerificacionCorreoException(
                    "CODIGO_AGOTADO",
                    "Agotaste los intentos permitidos. Solicita un código nuevo.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }

        if (!hashCodigo(normalizado, codigo).equals(registro.getCodigoHash())) {
            int nuevo = registro.getIntentos() + 1;
            registro.setIntentos(nuevo);
            codigoRepository.save(registro);
            int restantes = Math.max(0, maxIntentos - nuevo);
            if (restantes == 0) {
                invalidar(registro);
                throw new VerificacionCorreoException(
                        "CODIGO_AGOTADO",
                        "Código incorrecto. Agotaste los intentos; solicita un código nuevo.",
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            throw new VerificacionCorreoException(
                    "CODIGO_INCORRECTO",
                    "El código no es correcto. Te quedan " + restantes + " intento(s).",
                    HttpStatus.BAD_REQUEST);
        }

        invalidar(registro);
        marcarVerificado(normalizado);

        logger.info("Correo verificado correctamente: {}", normalizado);
        return new VerificacionResponse(normalizado, true, "Correo verificado correctamente.", maxIntentos);
    }

    private void validarRateLimit(String ip) {
        LocalDateTime desde = LocalDateTime.now().minus(Duration.ofHours(1));
        long enviados = codigoRepository.countByIpOrigenAndCreadoEnAfter(ip, desde);
        if (enviados >= limitePorHora) {
            throw new VerificacionCorreoException(
                    "RATE_LIMIT_SUPERADO",
                    "Demasiadas solicitudes de código desde esta IP. Intenta más tarde.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    private void enviarCorreo(String email, String codigo) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            logger.error("SMTP no configurado: no se pudo enviar el código a {}", email);
            throw new VerificacionCorreoException(
                    "SMTP_NO_CONFIGURADO",
                    "El servicio de correo no está configurado. Intenta más tarde.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(email);
            mensaje.setSubject("Código de verificación — EnergiAI");
            mensaje.setText(
                    "Hola,\n\nTu código de verificación es: " + codigo
                            + "\n\nEl código expira en " + ttlMinutos
                            + " minutos. Si no solicitaste este correo, por favor ignóralo.");
            sender.send(mensaje);
        } catch (Exception ex) {
            logger.error("Error al enviar el correo a {}: {}", email, ex.getMessage());
            throw new VerificacionCorreoException(
                    "ENVIO_CORREO_FALLIDO",
                    "No se pudo enviar el código de verificación. Intenta más tarde.",
                    HttpStatus.BAD_GATEWAY);
        }
    }

    private void invalidar(CodigoVerificacion registro) {
        registro.setUsado(true);
        codigoRepository.save(registro);
    }

    private void marcarVerificado(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseGet(() -> usuarioRepository.save(Usuario.builder().email(email).build()));
        if (!Boolean.TRUE.equals(usuario.getVerificado())) {
            usuario.setVerificado(true);
            usuarioRepository.save(usuario);
        }
    }

    private String generarCodigo() {
        int valor = RANDOM.nextInt(1_000_000);
        return String.format("%06d", valor);
    }

    private String hashCodigo(String email, String codigo) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((salt + ":" + email + ":" + codigo).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo generar el hash del código", ex);
        }
    }

    private String normalizarCorreo(String email) {
        return (email == null ? "" : email).trim().toLowerCase();
    }
}