package com.hackathon.energiai_api.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.AnalisisResponse;
import com.hackathon.energiai_api.DTOs.HistorialResponse;
import com.hackathon.energiai_api.service.AnalisisService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
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

    @GetMapping("/{id}")
    public ResponseEntity<AnalisisResponse> obtenerAnalisis(
            @PathVariable @Positive Long id) {

        return ResponseEntity.ok(analisisService.obtenerPorId(id));
    }

    @GetMapping
    public ResponseEntity<Page<HistorialResponse>> listarAnalisis(
            @RequestParam String usuarioId,
            @RequestParam(required = false) String categoria,
            @PageableDefault(size = 10, sort = "creadoEn", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<HistorialResponse> pagina = analisisService.listarPorUsuario(usuarioId, categoria, pageable);
        return ResponseEntity.ok(pagina);
    }
}