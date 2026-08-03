package com.hackathon.energiai_api.service;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.exception.ServicioAnalisisException;

@Service
public class IntegracionDsService {

    private final RestClient restClient;

    public IntegracionDsService(
            @Value("${modelo.api.url}") String modeloApiUrl
    ) {
        SimpleClientHttpRequestFactory requestFactory =
                new SimpleClientHttpRequestFactory();

        this.restClient = RestClient.builder()
                .baseUrl(modeloApiUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public record PrediccionDs(
            String categoria,
            BigDecimal probabilidad
    ) {
    }

    public PrediccionDs obtenerPrediccionDs(AnalisisRequest request) {
        if (request == null) {
            throw new ServicioAnalisisException(
                    "Los datos para realizar la predicción son obligatorios"
            );
        }

        try {
            PrediccionDs prediccion = restClient
                    .post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(PrediccionDs.class);

            if (prediccion == null) {
                throw new ServicioAnalisisException(
                        "La API del modelo devolvió una respuesta vacía"
                );
            }

            return prediccion;

        } catch (RestClientException exception) {
            throw new ServicioAnalisisException(
                    "No fue posible comunicarse con la API del modelo",
                    exception
            );
        }
    }
}