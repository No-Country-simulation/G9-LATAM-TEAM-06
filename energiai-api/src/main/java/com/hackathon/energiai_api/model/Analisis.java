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

    @Column(nullable = false, length = 30)
    private String categoria;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal probabilidad;

    @Column(name = "costo_estimado", nullable = false, precision = 10, scale = 2)
    private BigDecimal costo_estimado_mensual;

    @Column(name = "electrodomesticos_detalle", columnDefinition = "JSON")
    private String electrodomesticosDetalle;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private LocalDateTime creadoEn;
}
