package com.hackathon.energiai_api.DTOs;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public record AnalisisRequest(
        @NotNull(message = "El consumo en kWh es obligatorio")
        @Min(value = 40, message = "El consumo debe ser de al menos 40 kWh")
        @Max(value = 5000, message = "El consumo no puede superar 5.000 kWh")
        Integer consumo_kwh,

        @NotNull(message = "Debe especificar si utiliza energía durante el horario pico")
        Boolean uso_horario_pico,

        @NotNull(message = "La cantidad de equipos es obligatoria")
        @Min(value = 1, message = "La cantidad de equipos debe ser de al menos 1")
        @Max(value = 500, message = "La cantidad de equipos no puede superar 500")
        Integer cantidad_equipos,

        @NotBlank(message = "El tipo de inmueble es obligatorio")
        @Pattern(
                regexp = "Casa|Apartamento|Comercio|Oficina",
                message = "El inmueble debe ser Casa, Apartamento, Comercio u Oficina"
        )
        String tipo_inmueble,

        @NotNull(message = "Las horas de alto consumo son obligatorias")
        @Min(value = 0, message = "Las horas de alto consumo no pueden ser negativas")
        @Max(value = 24, message = "Las horas de alto consumo no pueden superar 24 por día")
        Integer horas_alto_consumo,

        @Min(value = 1, message = "La cantidad de personas debe ser mayor a 0")
        @Max(value = 30, message = "La cantidad de personas no puede superar 30")
        Integer cantidad_personas,

        @DecimalMin(value = "30.0", message = "El área debe ser de al menos 30 m²")
        @DecimalMax(value = "420.0", message = "El área no puede superar 420 m²")
        Float area_m2,

        @Min(value = 0, message = "Los equipos de alto consumo no pueden ser negativos")
        @Max(value = 500, message = "Los equipos de alto consumo no pueden superar 500")
        Integer equipos_alto_consumo,

        @DecimalMin(value = "0.0", message = "Las horas de aire acondicionado no pueden ser negativas")
        @DecimalMax(value = "12.0", message = "Las horas de aire acondicionado no pueden superar 12")
        Float horas_aire_acondicionado,

        @DecimalMin(value = "35.0", message = "El consumo anterior debe ser de al menos 35 kWh")
        @DecimalMax(value = "5000.0", message = "El consumo anterior no puede superar 5.000 kWh")
        Float consumo_mes_anterior_kwh,

        @Min(value = 28, message = "Los días facturados deben ser al menos 28")
        @Max(value = 31, message = "Los días facturados no pueden superar 31")
        Integer dias_facturados,

        @Size(max = 100, message = "El identificador de usuario no puede superar 100 caracteres")
        @Pattern(
                regexp = "invitado|[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+",
                message = "El usuario debe ser un correo válido o invitado"
        )
        String usuarioId,

        @Size(max = 17, message = "No se permiten más de 17 tipos de electrodomésticos")
        Map<String, Integer> electrodomesticos,

        @Min(value = 0, message = "Los dispositivos de alto consumo no pueden ser negativos")
        @Max(value = 500, message = "Los dispositivos de alto consumo no pueden superar 500")
        Integer dispositivos_alto,

        @Min(value = 0, message = "Los dispositivos de consumo medio no pueden ser negativos")
        @Max(value = 500, message = "Los dispositivos de consumo medio no pueden superar 500")
        Integer dispositivos_medio,

        @Min(value = 0, message = "Los dispositivos de bajo consumo no pueden ser negativos")
        @Max(value = 500, message = "Los dispositivos de bajo consumo no pueden superar 500")
        Integer dispositivos_bajo) {

    private static final Set<String> EQUIPOS_ALTO = Set.of(
            "aire_acondicionado", "calefactor", "secadora", "horno_electrico", "ducha_electrica"
    );
    private static final Set<String> EQUIPOS_MEDIO = Set.of(
            "lavadora", "lavavajillas", "plancha", "microondas", "bomba_agua"
    );
    private static final Set<String> EQUIPOS_BAJO = Set.of(
            "nevera", "freezer", "televisor", "computadora", "iluminacion_led", "router", "cargador_celular"
    );
    private static final Set<String> EQUIPOS_PERMITIDOS;

    static {
        Set<String> permitidos = new HashSet<>();
        permitidos.addAll(EQUIPOS_ALTO);
        permitidos.addAll(EQUIPOS_MEDIO);
        permitidos.addAll(EQUIPOS_BAJO);
        EQUIPOS_PERMITIDOS = Set.copyOf(permitidos);
    }

    @AssertTrue(message = "La distribución de equipos debe estar completa, ser no negativa y sumar la cantidad total")
    public boolean isDistribucionEquiposValida() {
        if (cantidad_equipos == null) {
            return true;
        }

        boolean tieneMapa = electrodomesticos != null && !electrodomesticos.isEmpty();
        boolean tieneManual = dispositivos_alto != null || dispositivos_medio != null || dispositivos_bajo != null;
        if (!tieneMapa && !tieneManual) {
            return false;
        }

        if (tieneMapa && sumaMapa() != cantidad_equipos.longValue()) {
            return false;
        }
        if (tieneManual) {
            if (dispositivos_alto == null || dispositivos_medio == null || dispositivos_bajo == null) {
                return false;
            }
            long sumaManual = (long) dispositivos_alto + dispositivos_medio + dispositivos_bajo;
            if (sumaManual != cantidad_equipos.longValue()) {
                return false;
            }
        }

        return !tieneMapa || !tieneManual
                || (dispositivos_alto.equals(sumaCategoria(EQUIPOS_ALTO))
                && dispositivos_medio.equals(sumaCategoria(EQUIPOS_MEDIO))
                && dispositivos_bajo.equals(sumaCategoria(EQUIPOS_BAJO)));
    }

    @AssertTrue(message = "El catálogo de electrodomésticos contiene nombres, valores o duplicados no permitidos")
    public boolean isElectrodomesticosValidos() {
        if (electrodomesticos == null || electrodomesticos.isEmpty()) {
            return true;
        }
        Set<String> normalizados = new HashSet<>();
        for (Map.Entry<String, Integer> entry : electrodomesticos.entrySet()) {
            String clave = entry.getKey();
            Integer valor = entry.getValue();
            if (clave == null || valor == null || valor < 0 || valor > 500) {
                return false;
            }
            String normalizada = clave.trim().toLowerCase(Locale.ROOT);
            if (!clave.equals(normalizada) || !EQUIPOS_PERMITIDOS.contains(normalizada)
                    || !normalizados.add(normalizada)) {
                return false;
            }
        }
        return true;
    }

    @AssertTrue(message = "Los equipos de alto consumo deben coincidir con la distribución y no superar el total")
    public boolean isCantidadEquiposAltoValida() {
        if (cantidad_equipos == null) {
            return true;
        }
        Integer equiposAlto = equiposAltoResueltos();
        if (equiposAlto != null && (equiposAlto < 0 || equiposAlto > cantidad_equipos)) {
            return false;
        }
        return equipos_alto_consumo == null || equiposAlto == null || equipos_alto_consumo.equals(equiposAlto);
    }

    @AssertTrue(message = "El área y el consumo anterior admiten máximo 2 decimales; las horas deben ser enteras")
    public boolean isPrecisionNumericaValida() {
        return finitoConDecimales(area_m2, 2)
                && finitoConDecimales(consumo_mes_anterior_kwh, 2)
                && enteroFinito(horas_aire_acondicionado);
    }

    @AssertTrue(message = "Los valores no están dentro del rango entrenado para el tipo de inmueble")
    public boolean isDentroDominioDelModelo() {
        if (tipo_inmueble == null || consumo_kwh == null || cantidad_equipos == null) {
            return true;
        }

        return switch (tipo_inmueble) {
            case "Casa" -> dentroOpcional(cantidad_personas, 1, 7) && dentroOpcional(area_m2, 60, 350);
            case "Apartamento" -> dentroOpcional(cantidad_personas, 1, 7) && dentroOpcional(area_m2, 35, 180);
            case "Comercio" -> dentroOpcional(cantidad_personas, 1, 15) && dentroOpcional(area_m2, 30, 420);
            case "Oficina" -> dentroOpcional(cantidad_personas, 1, 30) && dentroOpcional(area_m2, 30, 420);
            default -> true;
        };
    }

    public Integer equiposAltoResueltos() {
        if (dispositivos_alto != null) {
            return dispositivos_alto;
        }
        if (equipos_alto_consumo != null) {
            return equipos_alto_consumo;
        }
        return electrodomesticos == null || electrodomesticos.isEmpty() ? null : sumaCategoria(EQUIPOS_ALTO);
    }

    public Integer equiposMedioResueltos() {
        if (dispositivos_medio != null) {
            return dispositivos_medio;
        }
        return electrodomesticos == null || electrodomesticos.isEmpty() ? null : sumaCategoria(EQUIPOS_MEDIO);
    }

    public Integer equiposBajoResueltos() {
        if (dispositivos_bajo != null) {
            return dispositivos_bajo;
        }
        return electrodomesticos == null || electrodomesticos.isEmpty() ? null : sumaCategoria(EQUIPOS_BAJO);
    }

    private long sumaMapa() {
        return electrodomesticos.values().stream()
                .filter(valor -> valor != null && valor >= 0)
                .mapToLong(Integer::longValue)
                .sum();
    }

    private int sumaCategoria(Set<String> categoria) {
        if (electrodomesticos == null) {
            return 0;
        }
        return electrodomesticos.entrySet().stream()
                .filter(entry -> entry.getKey() != null
                        && categoria.contains(entry.getKey().trim().toLowerCase(Locale.ROOT)))
                .map(Map.Entry::getValue)
                .filter(valor -> valor != null && valor >= 0)
                .mapToInt(Integer::intValue)
                .sum();
    }

    private static boolean dentro(Number valor, double minimo, double maximo) {
        return Double.isFinite(valor.doubleValue())
                && valor.doubleValue() >= minimo
                && valor.doubleValue() <= maximo;
    }

    private static boolean dentroOpcional(Number valor, double minimo, double maximo) {
        return valor == null || dentro(valor, minimo, maximo);
    }

    private static boolean finitoConDecimales(Number valor, int decimales) {
        if (valor == null) {
            return true;
        }
        double numero = valor.doubleValue();
        if (!Double.isFinite(numero)) {
            return false;
        }
        BigDecimal decimal = new BigDecimal(valor.toString()).stripTrailingZeros();
        return Math.max(decimal.scale(), 0) <= decimales;
    }

    private static boolean enteroFinito(Number valor) {
        if (valor == null) {
            return true;
        }
        double numero = valor.doubleValue();
        return Double.isFinite(numero) && numero == Math.rint(numero);
    }
}
