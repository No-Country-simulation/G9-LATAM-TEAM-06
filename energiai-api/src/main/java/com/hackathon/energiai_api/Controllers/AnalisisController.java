package com.hackathon.energiai_api.Controllers;

import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.AnalisisResponse;
import com.hackathon.energiai_api.Repository.AnalisisRepository;
import com.hackathon.energiai_api.model.Analisis;
import com.hackathon.energiai_api.service.CalculoService;
import com.hackathon.energiai_api.service.IntegracionDsService;
import com.hackathon.energiai_api.service.RecomendacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/analisis-energetico")
@RequiredArgsConstructor
public class AnalisisController {

    private final CalculoService calculoService;
    private final RecomendacionService recomendacionService;
    private final IntegracionDsService integracionDsService;
    private final AnalisisRepository analisisRepository;

    @PostMapping
    public ResponseEntity<?> analizarConsumo(@Valid @RequestBody AnalisisRequest request) {
        IntegracionDsService.PrediccionDs prediccion = integracionDsService.obtenerPrediccionDs(request);

        // 2. Calcular la estimación financiera (tarifa de R$ 0.75 / kWh)
        BigDecimal costoEstimado = calculoService.calcularCostoMensual(request.consumo_kwh());

        // 3. Generar la lista de recomendaciones personalizadas
        List<String> recomendaciones = recomendacionService.generarRecomendaciones(request);

        // 4. Mapear y persistir el análisis en la base de datos MySQL
        Analisis analisisEntidad = Analisis.builder()
                .consumoKwh(request.consumo_kwh())
                .usoHorarioPico(request.uso_horario_pico())
                .cantidadEquipos(request.cantidad_equipos())
                .tipoInmueble(request.tipo_inmueble())
                .horasAltoConsumo(request.horas_alto_consumo())
                .categoria(prediccion.categoria())
                .probabilidad(prediccion.probabilidad())
                .costoEstimado(costoEstimado)
                .build();

        analisisRepository.save(analisisEntidad);

        // 5. Construir y retornar la respuesta final estructurada en JSON
        AnalisisResponse response = new AnalisisResponse(
                prediccion.categoria(),
                prediccion.probabilidad(),
                recomendaciones,
                costoEstimado
        );

        return ResponseEntity.ok(response);

    }
}
