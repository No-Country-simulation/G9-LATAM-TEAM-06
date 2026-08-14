package com.hackathon.energiai_api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathon.energiai_api.DTOs.AnalisisRequest;
import com.hackathon.energiai_api.DTOs.AnalisisResponse;
import com.hackathon.energiai_api.DTOs.HistorialResponse;
import com.hackathon.energiai_api.DTOs.ModeloApiResponse;
import com.hackathon.energiai_api.exception.ServicioAnalisisException;
import com.hackathon.energiai_api.model.Analisis;
import com.hackathon.energiai_api.repository.AnalisisRepository;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@Service
@RequiredArgsConstructor
@Validated
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
    public AnalisisResponse analizar(
            @NotNull(message = "La solicitud de análisis es obligatoria") @Valid AnalisisRequest request) {

        ModeloApiResponse modeloResponse = integracionDsService.obtenerRespuestaCompleta(request);

        IntegracionDsService.PrediccionDs prediccion;
        if (modeloResponse != null && modeloResponse.categoria() != null) {
            BigDecimal probabilidad = BigDecimal.valueOf(modeloResponse.probabilidad() != null ? modeloResponse.probabilidad() : 0.5)
                    .setScale(2, RoundingMode.HALF_UP);
            prediccion = new IntegracionDsService.PrediccionDs(modeloResponse.categoria(), probabilidad);
        } else {
            prediccion = integracionDsService.fallbackPrediccion(request);
        }

        BigDecimal costo_estimado_mensual
                = calculoService.calcularCostoMensual(request.consumo_kwh());

        List<String> recomendaciones
                = recomendacionService.generarRecomendaciones(request, modeloResponse);
        String nivelAnalisis = modeloResponse != null && modeloResponse.nivelAnalisis() != null
                ? modeloResponse.nivelAnalisis()
                : determinarNivelAnalisis(request);
        List<String> camposImputados = modeloResponse != null && modeloResponse.camposImputados() != null
                ? modeloResponse.camposImputados()
                : determinarCamposImputados(request);

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
            electrodomesticosJson = serializar(clasificacionEquipos);
        }

        Analisis analisis = Analisis.builder()
                .usuarioId(normalizarUsuario(request.usuarioId()))
                .consumoKwh(request.consumo_kwh())
                .usoHorarioPico(request.uso_horario_pico())
                .cantidadEquipos(request.cantidad_equipos())
                .tipoInmueble(request.tipo_inmueble().trim())
                .horasAltoConsumo(request.horas_alto_consumo())
                .cantidadPersonas(request.cantidad_personas())
                .areaM2(request.area_m2())
                .equiposAltoConsumo(request.equiposAltoResueltos())
                .horasAireAcondicionado(request.horas_aire_acondicionado())
                .consumoMesAnteriorKwh(request.consumo_mes_anterior_kwh())
                .diasFacturados(request.dias_facturados())
                .categoria(prediccion.categoria())
                .probabilidad(prediccion.probabilidad())
                .costo_estimado_mensual(costo_estimado_mensual)
                .electrodomesticosDetalle(electrodomesticosJson)
                .recomendacionesJson(serializar(recomendaciones))
                .nivelAnalisis(nivelAnalisis)
                .camposImputadosJson(serializar(camposImputados))
                .build();

        analisisRepository.save(analisis);

        return new AnalisisResponse(
                prediccion.categoria(),
                prediccion.probabilidad(),
                recomendaciones,
                costo_estimado_mensual,
                clasificacionEquipos,
                nivelAnalisis,
                camposImputados
        );
    }

    @Transactional(readOnly = true)
    public AnalisisResponse obtenerPorId(Long id) {
        Analisis analisis = analisisRepository.findById(id)
                .orElseThrow(() -> new ServicioAnalisisException("Análisis no encontrado con ID: " + id));

        return mapToResponseDTO(analisis);
    }

    @Transactional(readOnly = true)
    public HistorialResponse obtenerHistorialPorId(Long id) {
        Analisis analisis = analisisRepository.findById(id)
                .orElseThrow(() -> new ServicioAnalisisException("Análisis no encontrado con ID: " + id));

        return mapToHistorialResponse(analisis);
    }

    @Transactional(readOnly = true)
    public Page<HistorialResponse> listarPorUsuario(String usuarioId, String categoria, Pageable pageable) {
        Page<Analisis> resultados;
        String usuarioNormalizado = normalizarUsuario(usuarioId);

        if (categoria != null && !categoria.isBlank()) {
            resultados = analisisRepository.findByUsuarioIdAndCategoria(usuarioNormalizado, categoria, pageable);
        } else {
            resultados = analisisRepository.findByUsuarioId(usuarioNormalizado, pageable);
        }

        return resultados.map(this::mapToHistorialResponse);
    }

    private HistorialResponse mapToHistorialResponse(Analisis analisis) {
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

        AnalisisRequest requestTemporal = new AnalisisRequest(
                analisis.getConsumoKwh(),
                analisis.getUsoHorarioPico(),
                analisis.getCantidadEquipos(),
                analisis.getTipoInmueble(),
                analisis.getHorasAltoConsumo(),
                analisis.getCantidadPersonas(),
                analisis.getAreaM2(),
                analisis.getEquiposAltoConsumo(),
                analisis.getHorasAireAcondicionado(),
                analisis.getConsumoMesAnteriorKwh(),
                analisis.getDiasFacturados(),
                analisis.getUsuarioId(),
                null,
                null,
                null,
                null
        );

        List<String> recomendaciones = obtenerRecomendacionesGuardadas(analisis, requestTemporal);

        return new HistorialResponse(
                analisis.getId(),
                analisis.getCreadoEn(),
                analisis.getUsuarioId(),
                analisis.getConsumoKwh(),
                analisis.getTipoInmueble(),
                analisis.getCantidadEquipos(),
                analisis.getHorasAltoConsumo(),
                analisis.getUsoHorarioPico(),
                analisis.getCategoria(),
                analisis.getProbabilidad(),
                analisis.getCosto_estimado_mensual(),
                recomendaciones,
                clasificacionEquipos
        );
    }

    private AnalisisResponse mapToResponseDTO(Analisis analisis) {
        AnalisisRequest requestTemporal = new AnalisisRequest(
                analisis.getConsumoKwh(),
                analisis.getUsoHorarioPico(),
                analisis.getCantidadEquipos(),
                analisis.getTipoInmueble(),
                analisis.getHorasAltoConsumo(),
                analisis.getCantidadPersonas(),
                analisis.getAreaM2(),
                analisis.getEquiposAltoConsumo(),
                analisis.getHorasAireAcondicionado(),
                analisis.getConsumoMesAnteriorKwh(),
                analisis.getDiasFacturados(),
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

        List<String> recomendaciones = obtenerRecomendacionesGuardadas(analisis, requestTemporal);

        return new AnalisisResponse(
                analisis.getCategoria(),
                analisis.getProbabilidad(),
                recomendaciones,
                analisis.getCosto_estimado_mensual(),
                clasificacionEquipos,
                analisis.getNivelAnalisis() != null ? analisis.getNivelAnalisis() : determinarNivelAnalisis(requestTemporal),
                deserializarLista(analisis.getCamposImputadosJson(), determinarCamposImputados(requestTemporal))
        );
    }

    @Transactional
    public long borrarHistorialPorUsuario(String usuarioId) {
        return analisisRepository.deleteByUsuarioId(normalizarUsuario(usuarioId));
    }

    private List<String> obtenerRecomendacionesGuardadas(Analisis analisis, AnalisisRequest request) {
        return deserializarLista(
                analisis.getRecomendacionesJson(),
                recomendacionService.generarRecomendaciones(request)
        );
    }

    private String serializar(Object valor) {
        try {
            return objectMapper.writeValueAsString(valor);
        } catch (Exception exception) {
            return null;
        }
    }

    private List<String> deserializarLista(String json, List<String> valorAlternativo) {
        if (json == null || json.isBlank()) {
            return valorAlternativo;
        }
        try {
            return objectMapper.readValue(
                    json,
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}
            );
        } catch (Exception exception) {
            return valorAlternativo;
        }
    }

    private String normalizarUsuario(String usuarioId) {
        if (usuarioId == null || usuarioId.isBlank()) {
            return "invitado";
        }
        return usuarioId.trim().toLowerCase();
    }

    private String determinarNivelAnalisis(AnalisisRequest request) {
        int presentes = 0;
        presentes += request.cantidad_personas() != null ? 1 : 0;
        presentes += request.area_m2() != null ? 1 : 0;
        presentes += request.horas_aire_acondicionado() != null ? 1 : 0;
        presentes += request.consumo_mes_anterior_kwh() != null ? 1 : 0;
        presentes += request.dias_facturados() != null ? 1 : 0;
        if (presentes == 0) {
            return "basico";
        }
        return presentes == 5 ? "avanzado" : "parcial";
    }

    private List<String> determinarCamposImputados(AnalisisRequest request) {
        // Los campos ausentes ya no se estiman: el modelo básico no los incluye.
        return List.of();
    }
}
