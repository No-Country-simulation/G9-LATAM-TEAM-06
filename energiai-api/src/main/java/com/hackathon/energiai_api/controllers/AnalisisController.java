package com.hackathon.energiai_api.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import com.hackathon.energiai_api.dtos.AnalisisRequest;
import com.hackathon.energiai_api.dtos.AnalisisResponse;
import com.hackathon.energiai_api.dtos.HistorialResponse;
import com.hackathon.energiai_api.service.AnalisisService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/analisis-energetico")
@RequiredArgsConstructor
@Validated
public class AnalisisController {

    private final AnalisisService analisisService;

    @PostMapping
    public ResponseEntity<AnalisisResponse> analizarConsumo(
            @Valid @RequestBody AnalisisRequest request) {

        AnalisisResponse response = analisisService.analizar(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalisisResponse> obtenerAnalisis(
            @PathVariable @Positive Long id,
            @RequestParam
            @NotBlank(message = "El identificador de usuario es obligatorio")
            @Size(max = 100, message = "El identificador de usuario no puede superar 100 caracteres")
            @Pattern(regexp = AnalisisRequest.REGEX_USUARIO_VALIDO, message = "El usuario debe ser un correo válido o invitado")
            String usuarioId) {

        return ResponseEntity.ok(analisisService.obtenerPorId(id, usuarioId));
    }

    @GetMapping("/historial/{id}")
    public ResponseEntity<HistorialResponse> obtenerHistorialPorId(
            @PathVariable @Positive Long id,
            @RequestParam
            @NotBlank(message = "El identificador de usuario es obligatorio")
            @Size(max = 100, message = "El identificador de usuario no puede superar 100 caracteres")
            @Pattern(regexp = AnalisisRequest.REGEX_USUARIO_VALIDO, message = "El usuario debe ser un correo válido o invitado")
            String usuarioId) {

        return ResponseEntity.ok(analisisService.obtenerHistorialPorId(id, usuarioId));
    }

    @GetMapping
    public ResponseEntity<Page<HistorialResponse>> listarAnalisis(
            @RequestParam
            @NotBlank(message = "El identificador de usuario es obligatorio")
            @Size(max = 100, message = "El identificador de usuario no puede superar 100 caracteres")
            @Pattern(regexp = AnalisisRequest.REGEX_USUARIO_VALIDO, message = "El usuario debe ser un correo válido o invitado")
            String usuarioId,
            @RequestParam(required = false)
            @Pattern(regexp = "Eficiente|Moderado|Ineficiente", message = "La categoría no es válida")
            String categoria,
            @PageableDefault(size = 10, sort = "creadoEn", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<HistorialResponse> pagina = analisisService.listarPorUsuario(usuarioId, categoria, pageable);
        return ResponseEntity.ok(pagina);
    }

    @DeleteMapping
    public ResponseEntity<Void> borrarHistorial(
            @RequestParam
            @NotBlank(message = "El identificador de usuario es obligatorio")
            @Size(max = 100, message = "El identificador de usuario no puede superar 100 caracteres")
            @Pattern(regexp = AnalisisRequest.REGEX_USUARIO_VALIDO, message = "El usuario debe ser un correo válido o invitado")
            String usuarioId) {
        analisisService.borrarHistorialPorUsuario(usuarioId);
        return ResponseEntity.noContent().build();
    }
}
