package com.hackathon.energiai_api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathon.energiai_api.catalogo.CatalogoElectrodomesticos;
import com.hackathon.energiai_api.dtos.*;
import com.hackathon.energiai_api.exception.RecursoNoEncontradoException;
import com.hackathon.energiai_api.exception.ServicioAnalisisException;
import com.hackathon.energiai_api.model.Analisis;
import com.hackathon.energiai_api.model.Usuario;
import com.hackathon.energiai_api.repository.AnalisisRepository;
import com.hackathon.energiai_api.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Validated
public class AnalisisService {

    private final CalculoService calculoService;
    private final RecomendacionService recomendacionService;
    private final IntegracionDsService integracionDsService;
    private final AnalisisRepository analisisRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public AnalisisResponse analizar(
            @NotNull(message = "La solicitud de análisis es obligatoria") @Valid AnalisisRequest request) {

        ModeloApiResponse modeloResponse = integracionDsService.obtenerRespuestaCompleta(request);

        IntegracionDsService.PrediccionDs prediccion;
        if (modeloResponse != null && modeloResponse.categoria() != null) {
            BigDecimal probabilidad = IntegracionDsService.probabilidadAcotada(modeloResponse.probabilidad());
            prediccion = new IntegracionDsService.PrediccionDs(modeloResponse.categoria(), probabilidad);
        } else {
            prediccion = integracionDsService.fallbackPrediccion(request);
        }

        BigDecimal costo_estimado_mensual
                = calculoService.calcularCostoMensual(request.consumo_kwh());

        List<String> recomendaciones
                = recomendacionService.generarRecomendaciones(request, modeloResponse);
        List<RecomendacionModelo> recomendacionesDetalle
                = recomendacionService.generarRecomendacionesDetalle(request, modeloResponse);
        if ((recomendacionesDetalle == null || recomendacionesDetalle.isEmpty())
                && recomendaciones != null && !recomendaciones.isEmpty()) {
            recomendacionesDetalle = new ArrayList<>();
            for (int indice = 0; indice < recomendaciones.size(); indice++) {
                recomendacionesDetalle.add(new RecomendacionModelo(
                        "legacy_" + (indice + 1), recomendaciones.get(indice), null, List.of()));
            }
        }
        if (recomendaciones == null) {
            recomendaciones = List.of();
        }
        String nivelAnalisis = modeloResponse != null && modeloResponse.nivelAnalisis() != null
                ? modeloResponse.nivelAnalisis()
                : determinarNivelAnalisis(request);
        List<String> camposImputados = modeloResponse != null && modeloResponse.camposImputados() != null
                ? modeloResponse.camposImputados()
                : determinarCamposImputados(request);
        String origenPrediccion = modeloResponse != null
                ? valorO(modeloResponse.origenPrediccion(), "modelo_ml")
                : "fallback_reglas";
        String modeloVersion = modeloResponse != null
                ? valorO(modeloResponse.modeloVersion(), "no_reportada")
                : "reglas-backend-1.0.0";
        List<String> advertencias = modeloResponse != null && modeloResponse.advertencias() != null
                ? modeloResponse.advertencias()
                : List.of("El servicio de modelos no estuvo disponible; se aplicaron reglas de respaldo.");

        ClasificacionEquipos clasificacion = clasificarEquipos(request);
        Map<String, Integer> clasificacionEquipos = clasificacion.clasificacionEquipos();

        String usuarioNormalizado = normalizarUsuario(request.usuarioId());
        boolean esInvitado = "invitado".equals(usuarioNormalizado);

        Usuario usuario = null;
        String nombreAnalisis = null;
        if (!esInvitado) {
            usuario = usuarioRepository.findByEmail(usuarioNormalizado)
                    .orElseThrow(() -> new com.hackathon.energiai_api.exception.VerificacionCorreoException(
                            "CORREO_NO_VERIFICADO",
                            "Debes verificar el correo antes de guardar análisis.",
                            org.springframework.http.HttpStatus.FORBIDDEN));
            if (!Boolean.TRUE.equals(usuario.getVerificado())) {
                throw new com.hackathon.energiai_api.exception.VerificacionCorreoException(
                        "CORREO_NO_VERIFICADO",
                        "Debes verificar el correo antes de guardar análisis.",
                        org.springframework.http.HttpStatus.FORBIDDEN);
            }
            nombreAnalisis = resolverNombreAnalisis(request.nombre_o_numero_analisis(), usuario);
        }

        Analisis analisis = Analisis.builder()
                .usuarioId(usuarioNormalizado)
                .usuario(usuario)
                .nombreONumeroAnalisis(nombreAnalisis)
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
                .electrodomesticosDetalle(clasificacion.electrodomesticosJson())
                .recomendacionesJson(serializar(recomendaciones))
                .recomendacionesDetalleJson(serializar(recomendacionesDetalle))
                .nivelAnalisis(nivelAnalisis)
                .camposImputadosJson(serializar(camposImputados))
                .origenPrediccion(origenPrediccion)
                .modeloVersion(modeloVersion)
                .advertenciasJson(serializar(advertencias))
                .build();

        if (!esInvitado) {
            analisisRepository.save(analisis);
        }

        return new AnalisisResponse(
                prediccion.categoria(),
                prediccion.probabilidad(),
                recomendaciones,
                costo_estimado_mensual,
                clasificacionEquipos,
                nivelAnalisis,
                camposImputados,
                recomendacionesDetalle,
                origenPrediccion,
                modeloVersion,
                advertencias,
                nombreAnalisis
        );
    }

    @Transactional(readOnly = true)
    public AnalisisResponse obtenerPorId(Long id, String usuarioId) {
        Analisis analisis = obtenerAnalisisDeUsuario(id, usuarioId);
        return mapToResponseDTO(analisis);
    }

    @Transactional(readOnly = true)
    public HistorialResponse obtenerHistorialPorId(Long id, String usuarioId) {
        Analisis analisis = obtenerAnalisisDeUsuario(id, usuarioId);
        return mapToHistorialResponse(analisis);
    }

    /** Recupera un análisis verificando que pertenezca al usuario solicitante (previene acceso cruzado). */
    private Analisis obtenerAnalisisDeUsuario(Long id, String usuarioId) {
        Analisis analisis = analisisRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Análisis no encontrado con ID: " + id));
        String usuarioNormalizado = normalizarUsuario(usuarioId);
        if (!analisis.getUsuarioId().equals(usuarioNormalizado)) {
            throw new RecursoNoEncontradoException("Análisis no encontrado con ID: " + id);
        }
        return analisis;
    }

    @Transactional(readOnly = true)
    public Page<HistorialResponse> listarPorUsuario(String usuarioId, String categoria, Pageable pageable) {
        String usuarioNormalizado = normalizarUsuario(usuarioId);
        if ("invitado".equals(usuarioNormalizado)) {
            // El historial de invitados vive en el navegador (localStorage), no en la BD.
            return org.springframework.data.domain.Page.empty(pageable);
        }

        Page<Analisis> resultados;
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
                analisis.getNombreONumeroAnalisis(),
                null,
                null,
                null,
                null
        );

        List<String> recomendaciones = obtenerRecomendacionesGuardadas(analisis, requestTemporal);
        List<RecomendacionModelo> detalles = obtenerDetallesGuardados(analisis, recomendaciones);

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
                clasificacionEquipos,
                detalles,
                valorO(analisis.getOrigenPrediccion(), "registro_legacy"),
                valorO(analisis.getModeloVersion(), "no_reportada"),
                deserializarLista(analisis.getAdvertenciasJson(), List.of()),
                analisis.getNombreONumeroAnalisis()
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
                analisis.getNombreONumeroAnalisis(),
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
        List<RecomendacionModelo> detalles = obtenerDetallesGuardados(analisis, recomendaciones);

        return new AnalisisResponse(
                analisis.getCategoria(),
                analisis.getProbabilidad(),
                recomendaciones,
                analisis.getCosto_estimado_mensual(),
                clasificacionEquipos,
                analisis.getNivelAnalisis() != null ? analisis.getNivelAnalisis() : determinarNivelAnalisis(requestTemporal),
                deserializarLista(analisis.getCamposImputadosJson(), determinarCamposImputados(requestTemporal)),
                detalles,
                valorO(analisis.getOrigenPrediccion(), "registro_legacy"),
                valorO(analisis.getModeloVersion(), "no_reportada"),
                deserializarLista(analisis.getAdvertenciasJson(), List.of()),
                analisis.getNombreONumeroAnalisis()
        );
    }

    @Transactional
    public long borrarHistorialPorUsuario(String usuarioId) {
        String usuarioNormalizado = normalizarUsuario(usuarioId);
        if ("invitado".equals(usuarioNormalizado)) {
            return 0L;
        }
        long eliminados = analisisRepository.deleteByUsuarioId(usuarioNormalizado);
        if (eliminados > 0) {
            // Al borrar todo el historial se reinicia la numeración ("Análisis 1" de nuevo).
            usuarioRepository.findByEmail(usuarioNormalizado)
                    .ifPresent(usuario -> usuarioRepository.resetearContador(usuario.getId()));
        }
        return eliminados;
    }

    /**
     * Borra únicamente los análisis indicados por ID que pertenezcan al usuario.
     * No reinicia la numeración porque el historial restante conserva sus nombres.
     */
    @Transactional
    public long borrarPorIds(String usuarioId, List<Long> ids) {
        String usuarioNormalizado = normalizarUsuario(usuarioId);
        if ("invitado".equals(usuarioNormalizado) || ids == null || ids.isEmpty()) {
            return 0L;
        }
        List<Long> idsValidos = ids.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        if (idsValidos.isEmpty()) {
            return 0L;
        }
        return analisisRepository.deleteByUsuarioIdAndIdIn(usuarioNormalizado, idsValidos);
    }

    private List<String> obtenerRecomendacionesGuardadas(Analisis analisis, AnalisisRequest request) {
        return deserializarLista(
                analisis.getRecomendacionesJson(),
                recomendacionService.generarRecomendaciones(request)
        );
    }

    private List<RecomendacionModelo> obtenerDetallesGuardados(
            Analisis analisis, List<String> recomendaciones) {
        String json = analisis.getRecomendacionesDetalleJson();
        if (json != null && !json.isBlank()) {
            try {
                return objectMapper.readValue(
                        json,
                        new com.fasterxml.jackson.core.type.TypeReference<List<RecomendacionModelo>>() {});
            } catch (Exception ignored) {
                // Los registros anteriores continúan siendo legibles.
            }
        }
        List<RecomendacionModelo> detalles = new ArrayList<>();
        for (int indice = 0; indice < recomendaciones.size(); indice++) {
            detalles.add(new RecomendacionModelo(
                    "legacy_" + (indice + 1), recomendaciones.get(indice), null, List.of()));
        }
        return detalles;
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

    @Transactional
    public List<HistorialResponse> migrarAnalisis(@Valid MigracionAnalisisRequest request) {
        String usuarioNormalizado = normalizarUsuario(request.usuarioId());
        if ("invitado".equals(usuarioNormalizado)) {
            throw new com.hackathon.energiai_api.exception.VerificacionCorreoException(
                    "CORREO_NO_VERIFICADO",
                    "Debes verificar el correo antes de migrar análisis.",
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }
        Usuario usuario = usuarioRepository.findByEmail(usuarioNormalizado)
                .orElseThrow(() -> new com.hackathon.energiai_api.exception.VerificacionCorreoException(
                        "CORREO_NO_VERIFICADO",
                        "Debes verificar el correo antes de migrar análisis.",
                        org.springframework.http.HttpStatus.FORBIDDEN));
        if (!Boolean.TRUE.equals(usuario.getVerificado())) {
            throw new com.hackathon.energiai_api.exception.VerificacionCorreoException(
                    "CORREO_NO_VERIFICADO",
                    "Debes verificar el correo antes de migrar análisis.",
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        List<HistorialResponse> migrados = new ArrayList<>();
        for (AnalisisMigracionItem item : request.analisis()) {
            AnalisisRequest solicitud = item.solicitud();
            ClasificacionEquipos clasificacion = clasificarEquipos(solicitud);

            List<String> recomendaciones = item.recomendaciones() != null ? item.recomendaciones() : List.of();
            List<RecomendacionModelo> detalles = item.recomendaciones_detalle() != null
                    ? item.recomendaciones_detalle() : List.of();
            if (detalles.isEmpty() && !recomendaciones.isEmpty()) {
                detalles = new ArrayList<>();
                for (int indice = 0; indice < recomendaciones.size(); indice++) {
                    detalles.add(new RecomendacionModelo(
                            "legacy_" + (indice + 1), recomendaciones.get(indice), null, List.of()));
                }
            }

            String nombreAnalisis = resolverNombreAnalisis(
                    solicitud.nombre_o_numero_analisis(), usuario);

            Analisis analisis = Analisis.builder()
                    .usuarioId(usuarioNormalizado)
                    .usuario(usuario)
                    .nombreONumeroAnalisis(nombreAnalisis)
                    .consumoKwh(solicitud.consumo_kwh())
                    .usoHorarioPico(solicitud.uso_horario_pico())
                    .cantidadEquipos(solicitud.cantidad_equipos())
                    .tipoInmueble(solicitud.tipo_inmueble().trim())
                    .horasAltoConsumo(solicitud.horas_alto_consumo())
                    .cantidadPersonas(solicitud.cantidad_personas())
                    .areaM2(solicitud.area_m2())
                    .equiposAltoConsumo(solicitud.equiposAltoResueltos())
                    .horasAireAcondicionado(solicitud.horas_aire_acondicionado())
                    .consumoMesAnteriorKwh(solicitud.consumo_mes_anterior_kwh())
                    .diasFacturados(solicitud.dias_facturados())
                    .categoria(item.categoria())
                    .probabilidad(item.probabilidad())
                    .costo_estimado_mensual(item.costo_estimado_mensual())
                    .electrodomesticosDetalle(clasificacion.electrodomesticosJson())
                    .recomendacionesJson(serializar(recomendaciones))
                    .recomendacionesDetalleJson(serializar(detalles))
                    .nivelAnalisis(valorO(item.nivel_analisis(), determinarNivelAnalisis(solicitud)))
                    .camposImputadosJson(serializar(
                            item.campos_imputados() != null ? item.campos_imputados() : List.of()))
                    .origenPrediccion(valorO(item.origen_prediccion(), "registro_migrado"))
                    .modeloVersion(valorO(item.modelo_version(), "no_reportada"))
                    .advertenciasJson(serializar(
                            item.advertencias() != null ? item.advertencias() : List.of()))
                    .build();

            migrados.add(mapToHistorialResponse(analisisRepository.save(analisis)));
        }
        return migrados;
    }

    private ClasificacionEquipos clasificarEquipos(AnalisisRequest request) {
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
                CatalogoElectrodomesticos.Categoria categoria = CatalogoElectrodomesticos.CATEGORIA_POR_NOMBRE
                        .getOrDefault(electro, CatalogoElectrodomesticos.Categoria.BAJO);
                conteo.merge(categoria.etiqueta(), cantidad, Integer::sum);
            }

            try {
                electrodomesticosJson = objectMapper.writeValueAsString(request.electrodomesticos());
            } catch (Exception e) {
                electrodomesticosJson = null;
            }

            clasificacionEquipos.put("alto", conteo.getOrDefault("alto", 0));
            clasificacionEquipos.put("medio", conteo.getOrDefault("medio", 0));
            clasificacionEquipos.put("bajo", conteo.getOrDefault("bajo", 0));
        } else if (request.dispositivos_alto() != null
                || request.dispositivos_medio() != null
                || request.dispositivos_bajo() != null) {
            // Modo General: usar campos manuales directamente
            int alta = request.dispositivos_alto() != null ? request.dispositivos_alto() : 0;
            int media = request.dispositivos_medio() != null ? request.dispositivos_medio() : 0;
            int baja = request.dispositivos_bajo() != null ? request.dispositivos_bajo() : 0;

            clasificacionEquipos.put("alto", alta);
            clasificacionEquipos.put("medio", media);
            clasificacionEquipos.put("bajo", baja);
            electrodomesticosJson = serializar(clasificacionEquipos);
        }

        return new ClasificacionEquipos(clasificacionEquipos, electrodomesticosJson);
    }

    private String normalizarUsuario(String usuarioId) {
        if (usuarioId == null || usuarioId.isBlank()) {
            return "invitado";
        }
        return usuarioId.trim().toLowerCase();
    }

    private String resolverNombreAnalisis(String nombreSolicitado, Usuario usuario) {
        int numero = siguienteNumeroAnalisis(usuario);
        if (nombreSolicitado != null && !nombreSolicitado.isBlank()) {
            return nombreSolicitado.trim();
        }
        return "Análisis " + numero;
    }

    private int siguienteNumeroAnalisis(Usuario usuario) {
        usuarioRepository.incrementarContador(usuario.getId());
        Integer numero = usuarioRepository.obtenerContadorAnalisis(usuario.getId());
        return numero != null ? numero : 0;
    }

    private String valorO(String valor, String alternativo) {
        return valor == null || valor.isBlank() ? alternativo : valor;
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

    private record ClasificacionEquipos(
            Map<String, Integer> clasificacionEquipos,
            String electrodomesticosJson) {
    }
}
