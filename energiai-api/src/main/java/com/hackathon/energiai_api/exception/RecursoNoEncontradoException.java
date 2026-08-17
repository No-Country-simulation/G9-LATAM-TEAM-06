package com.hackathon.energiai_api.exception;

/**
 * Indica que un recurso solicitado no existe o no pertenece al usuario solicitante.
 * Se traduce a HTTP 404 NOT FOUND para no revelar la existencia del recurso.
 */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String message) {
        super(message);
    }
}