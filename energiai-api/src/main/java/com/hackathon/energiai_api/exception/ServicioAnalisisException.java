package com.hackathon.energiai_api.exception;

public class ServicioAnalisisException extends RuntimeException {

    public ServicioAnalisisException(String message) {
        super(message);
    }

    public ServicioAnalisisException(String message, Throwable cause) {
        super(message, cause);
    }
}