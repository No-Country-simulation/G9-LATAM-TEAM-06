package com.hackathon.energiai_api.Controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.AnalisisResponse;
import com.hackathon.energiai_api.service.AnalisisService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/analisis-energetico")
@RequiredArgsConstructor
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
}