package com.hackathon.energiai_api.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hackathon.energiai_api.dtos.SolicitarCodigoRequest;
import com.hackathon.energiai_api.dtos.VerificacionResponse;
import com.hackathon.energiai_api.dtos.VerificarCodigoRequest;
import com.hackathon.energiai_api.service.VerificacionCorreoService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/verificacion")
@RequiredArgsConstructor
public class VerificacionController {

    private final VerificacionCorreoService verificacionCorreoService;

    @PostMapping("/codigo")
    public ResponseEntity<VerificacionResponse> solicitarCodigo(
            @Valid @RequestBody SolicitarCodigoRequest solicitud,
            HttpServletRequest request) {

        VerificacionResponse respuesta = verificacionCorreoService.solicitarCodigo(
                solicitud.email(), ipCliente(request));
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/verificar")
    public ResponseEntity<VerificacionResponse> verificarCodigo(
            @Valid @RequestBody VerificarCodigoRequest solicitud) {

        VerificacionResponse respuesta = verificacionCorreoService.verificarCodigo(
                solicitud.email(), solicitud.codigo());
        return ResponseEntity.ok(respuesta);
    }

    private String ipCliente(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}