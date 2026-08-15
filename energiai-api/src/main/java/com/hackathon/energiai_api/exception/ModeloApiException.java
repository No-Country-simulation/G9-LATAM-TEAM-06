package com.hackathon.energiai_api.exception;

public class ModeloApiException extends RuntimeException {

    public ModeloApiException(String mensaje) {
        super(mensaje);
    }

    public ModeloApiException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}