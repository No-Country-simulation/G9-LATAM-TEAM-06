package com.hackathon.energiai_api.DTOs;

public record VerificacionResponse(
        String email,
        boolean verificado,
        String mensaje,
        Integer reintentosRestantes) {
}