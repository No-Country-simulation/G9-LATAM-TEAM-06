package com.hackathon.energiai_api.exception;

import org.springframework.http.HttpStatus;

public class VerificacionCorreoException extends RuntimeException {

    private final HttpStatus estado;
    private final String codigo;

    public VerificacionCorreoException(String codigo, String mensaje, HttpStatus estado) {
        super(mensaje);
        this.codigo = codigo;
        this.estado = estado;
    }

    public HttpStatus getEstado() {
        return estado;
    }

    public String getCodigo() {
        return codigo;
    }
}