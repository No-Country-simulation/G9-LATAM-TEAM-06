package com.hackathon.energiai_api.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "analisis_energetico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Analisis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = true)
    private String usuarioId;

    @Column(name = "consumo_kwh", nullable = false)
    private Integer consumoKwh;

    @Column(name = "uso_horario_pico", nullable = false)
    private Boolean usoHorarioPico;

    @Column(name = "cantidad_equipos", nullable = false)
    private Integer cantidadEquipos;

    @Column(name = "tipo_inmueble", nullable = false, length = 50)
    private String tipoInmueble;

    @Column(name = "horas_alto_consumo", nullable = false)
    private Integer horasAltoConsumo;

    @Column(name = "cantidad_personas", nullable = true)
    private Integer cantidadPersonas;

    @Column(name = "area_m2", nullable = true)
    private Float areaM2;

    @Column(name = "equipos_alto_consumo", nullable = true)
    private Integer equiposAltoConsumo;

    @Column(name = "horas_aire_acondicionado", nullable = true)
    private Float horasAireAcondicionado;

    @Column(name = "consumo_mes_anterior_kwh", nullable = true)
    private Float consumoMesAnteriorKwh;

    @Column(name = "dias_facturados", nullable = true)
    private Integer diasFacturados;

    @Column(nullable = false, length = 30)
    private String categoria;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal probabilidad;

    @Column(name = "costo_estimado", nullable = false, precision = 10, scale = 2)
    private BigDecimal costo_estimado_mensual;

    @Column(name = "electrodomesticos_detalle", columnDefinition = "JSON")
    private String electrodomesticosDetalle;

    @Column(name = "recomendaciones_json", columnDefinition = "JSON")
    private String recomendacionesJson;

    @Column(name = "nivel_analisis", length = 20)
    private String nivelAnalisis;

    @Column(name = "campos_imputados_json", columnDefinition = "JSON")
    private String camposImputadosJson;

    @Column(name = "recomendaciones_detalle_json", columnDefinition = "JSON")
    private String recomendacionesDetalleJson;

    @Column(name = "origen_prediccion", length = 30)
    private String origenPrediccion;

    @Column(name = "modelo_version", length = 100)
    private String modeloVersion;

    @Column(name = "advertencias_json", columnDefinition = "JSON")
    private String advertenciasJson;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private LocalDateTime creadoEn;
}
