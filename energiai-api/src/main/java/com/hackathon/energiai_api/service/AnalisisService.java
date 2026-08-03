package com.hackathon.energiai_api.service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.AnalisisResponse;
import com.hackathon.energiai_api.exception.ServicioAnalisisException;
import com.hackathon.energiai_api.model.Analisis;
import com.hackathon.energiai_api.repository.AnalisisRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalisisService {

    private final CalculoService calculoService;
    private final RecomendacionService recomendacionService;
    private final IntegracionDsService integracionDsService;
    private final AnalisisRepository analisisRepository;
    private final ObjectMapper objectMapper;

    // Catálogo de clasificación de electrodomésticos
    private static final Map<String, String> CATEGORIA_POR_ELECTRODOMESTICO = Map.ofEntries(
        Map.entry("aire_acondicionado", "ALTO"),
        Map.entry("calefactor", "ALTO"),
        Map.entry("secadora", "ALTO"),
        Map.entry("horno_electrico", "ALTO"),
        Map.entry("ducha_electrica", "ALTO"),
        Map.entry("lavadora", "MEDIO"),
        Map.entry("lavavajillas", "MEDIO"),
        Map.entry("plancha", "MEDIO"),
        Map.entry("microondas", "MEDIO"),
        Map.entry("bomba_agua", "MEDIO"),
        Map.entry("nevera", "BAJO"),
        Map.entry("freezer", "BAJO"),
        Map.entry("televisor", "BAJO"),
        Map.entry("computadora", "BAJO"),
        Map.entry("iluminacion_led", "BAJO"),
        Map.entry("router", "BAJO"),
        Map.entry("cargador_celular", "BAJO")
    );

    @Transactional
    public AnalisisResponse analizar(AnalisisRequest request) {

        IntegracionDsService.PrediccionDs prediccion
                = integracionDsService.obtenerPrediccionDs(request);

        BigDecimal costo_estimado_mensual
                = calculoService.calcularCostoMensual(request.consumo_kwh());

        List<String> recomendaciones
                = recomendacionService.generarRecomendaciones(request);

        // Clasificar electrodomésticos si se proporcionan (mapa detallado) O usar campos manuales (General)
        Map<String, Integer> clasificacionEquipos = new LinkedHashMap<>();
        String electrodomesticosJson = null;

        if (request.electrodomesticos() != null && !request.electrodomesticos().isEmpty()) {
            // Modo Exhaustivo: clasificación automática por catálogo
            Map<String, Integer> conteo = new LinkedHashMap<>();
            conteo.put("alto", 0);
            conteo.put("medio", 0);
            conteo.put("bajo", 0);

            for (Map.Entry<String, Integer> entry : request.electrodomesticos().entrySet()) {
                String electro = entry.getKey().toLowerCase().trim();
                int cantidad = entry.getValue();
                String categoria = CATEGORIA_POR_ELECTRODOMESTICO.getOrDefault(electro, "BAJO");
                conteo.merge(categoria.toLowerCase(), cantidad, Integer::sum);
            }

            // Serializar a JSON
            try {
                electrodomesticosJson = objectMapper.writeValueAsString(request.electrodomesticos());
            } catch (Exception e) {
                electrodomesticosJson = null;
            }

            clasificacionEquipos.put("alto", conteo.getOrDefault("alto", 0));
            clasificacionEquipos.put("medio", conteo.getOrDefault("medio", 0));
            clasificacionEquipos.put("bajo", conteo.getOrDefault("bajo", 0));
        } else if (request.dispositivos_alto() != null || request.dispositivos_medio() != null || request.dispositivos_bajo() != null) {
            // Modo General: usar campos manuales directamente
            int alta = request.dispositivos_alto() != null ? request.dispositivos_alto() : 0;
            int media = request.dispositivos_medio() != null ? request.dispositivos_medio() : 0;
            int baja = request.dispositivos_bajo() != null ? request.dispositivos_bajo() : 0;

            clasificacionEquipos.put("alto", alta);
            clasificacionEquipos.put("medio", media);
            clasificacionEquipos.put("bajo", baja);
        }

        Analisis analisis = Analisis.builder()
                .usuarioId(request.usuarioId())
                .consumoKwh(request.consumo_kwh())
                .usoHorarioPico(request.uso_horario_pico())
                .cantidadEquipos(request.cantidad_equipos())
                .tipoInmueble(request.tipo_inmueble().trim())
                .horasAltoConsumo(request.horas_alto_consumo())
                .categoria(prediccion.categoria())
                .probabilidad(prediccion.probabilidad())
                .costo_estimado_mensual(costo_estimado_mensual)
                .electrodomesticosDetalle(electrodomesticosJson)
                .build();

        analisisRepository.save(analisis);

        return new AnalisisResponse(
                prediccion.categoria(),
                prediccion.probabilidad(),
                recomendaciones,
                costo_estimado_mensual,
                clasificacionEquipos
        );
    }

    @Transactional(readOnly = true)
    public AnalisisResponse obtenerPorId(Long id) {
        Analisis analisis = analisisRepository.findById(id)
                .orElseThrow(() -> new ServicioAnalisisException("Análisis no encontrado con ID: " + id));

        return mapToResponseDTO(analisis);
    }

    @Transactional(readOnly = true)
    public Page<AnalisisResponse> listarPorUsuario(String usuarioId, String categoria, Pageable pageable) {
        Page<Analisis> resultados;

        if (categoria != null && !categoria.isBlank()) {
            resultados = analisisRepository.findByUsuarioIdAndCategoria(usuarioId, categoria, pageable);
        } else {
            resultados = analisisRepository.findByUsuarioId(usuarioId, pageable);
        }

        return resultados.map(this::mapToResponseDTO);
    }

    private AnalisisResponse mapToResponseDTO(Analisis analisis) {
        AnalisisRequest requestTemporal = new AnalisisRequest(
                analisis.getConsumoKwh(),
                analisis.getUsoHorarioPico(),
                analisis.getCantidadEquipos(),
                analisis.getTipoInmueble(),
                analisis.getHorasAltoConsumo(),
                analisis.getUsuarioId(),
                null,
                null,
                null,
                null
        );

        // Deserializar clasificación si existe
        Map<String, Integer> clasificacionEquipos = null;
        if (analisis.getElectrodomesticosDetalle() != null) {
            try {
                clasificacionEquipos = objectMapper.readValue(
                    analisis.getElectrodomesticosDetalle(),
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Integer>>() {}
                );
            } catch (Exception e) {
                clasificacionEquipos = null;
            }
        }

        List<String> recomendaciones = recomendacionService.generarRecomendaciones(requestTemporal);

        return new AnalisisResponse(
                analisis.getCategoria(),
                analisis.getProbabilidad(),
                recomendaciones,
                analisis.getCosto_estimado_mensual(),
                clasificacionEquipos
        );
    }
}
