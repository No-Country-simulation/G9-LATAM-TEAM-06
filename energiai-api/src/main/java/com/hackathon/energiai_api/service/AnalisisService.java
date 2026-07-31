package com.hackathon.energiai_api.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.AnalisisResponse;
import com.hackathon.energiai_api.Repository.AnalisisRepository;
import com.hackathon.energiai_api.exception.ServicioAnalisisException;
import com.hackathon.energiai_api.model.Analisis;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalisisService {

    private final CalculoService calculoService;
    private final RecomendacionService recomendacionService;
    private final IntegracionDsService integracionDsService;
    private final AnalisisRepository analisisRepository;

    @Transactional
    public AnalisisResponse analizar(AnalisisRequest request) {

        IntegracionDsService.PrediccionDs prediccion =
                integracionDsService.obtenerPrediccionDs(request);

        BigDecimal costoEstimado =
                calculoService.calcularCostoMensual(request.consumo_kwh());

        List<String> recomendaciones =
                recomendacionService.generarRecomendaciones(request);

        Analisis analisis = Analisis.builder()
                .consumoKwh(request.consumo_kwh())
                .usoHorarioPico(request.uso_horario_pico())
                .cantidadEquipos(request.cantidad_equipos())
                .tipoInmueble(request.tipo_inmueble().trim())
                .horasAltoConsumo(request.horas_alto_consumo())
                .categoria(prediccion.categoria())
                .probabilidad(prediccion.probabilidad())
                .costoEstimado(costoEstimado)
                .build();

        analisisRepository.save(analisis);

        return new AnalisisResponse(
                prediccion.categoria(),
                prediccion.probabilidad(),
                recomendaciones,
                costoEstimado
        );
    }

    @Transactional(readOnly = true)
    public AnalisisResponse obtenerPorId(Long id) {
        Analisis analisis = analisisRepository.findById(id)
                .orElseThrow(() -> new ServicioAnalisisException("Análisis no encontrado con ID: " + id));

        return new AnalisisResponse(
                analisis.getCategoria(),
                analisis.getProbabilidad(),
                recomendacionService.generarRecomendaciones(
                        new com.hackathon.energiai_api.DTOs.AnalisisRequest(
                                analisis.getConsumoKwh(),
                                analisis.getUsoHorarioPico(),
                                analisis.getCantidadEquipos(),
                                analisis.getTipoInmueble(),
                                analisis.getHorasAltoConsumo()
                        )),
                analisis.getCostoEstimado()
        );
    }
}