package com.hackathon.energiai_api.dtos;

public record VerificacionResponse(
        String email,
        boolean verificado,
        String mensaje,
        Integer reintentosRestantes) {
}