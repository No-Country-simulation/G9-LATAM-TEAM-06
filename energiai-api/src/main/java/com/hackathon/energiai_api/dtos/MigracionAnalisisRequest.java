package com.hackathon.energiai_api.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Solicitud de migración de análisis locales (navegador) hacia la BD.
 * Los resultados ya están calculados, por lo que el backend no vuelve a
 * consultar el modelo: solo persiste preservando la trazabilidad original.
 */
public record MigracionAnalisisRequest(
        @NotBlank(message = "El identificador de usuario es obligatorio")
        @Size(max = 100, message = "El identificador de usuario no puede superar 100 caracteres")
        @Pattern(regexp = AnalisisRequest.REGEX_USUARIO_VALIDO, message = "El usuario debe ser un correo válido o invitado")
        String usuarioId,

        @NotNull(message = "La lista de análisis a migrar es obligatoria")
        @Size(min = 1, max = 500, message = "Se pueden migrar entre 1 y 500 análisis por solicitud")
        List<@Valid AnalisisMigracionItem> analisis) {
}