package com.hackathon.energiai_api.catalogo;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Catálogo único de electrodomésticos y su categoría de consumo (ALTO/MEDIO/BAJO).
 * Fuente de verdad compartida entre la validación del request y la clasificación del servicio.
 */
public final class CatalogoElectrodomesticos {

    private CatalogoElectrodomesticos() {
    }

    public enum Categoria {
        ALTO, MEDIO, BAJO;

        /** Etiqueta en minúsculas usada en la clasificación (alto/medio/bajo). */
        public String etiqueta() {
            return name().toLowerCase();
        }
    }

    public static final Map<String, Categoria> CATEGORIA_POR_NOMBRE = Map.ofEntries(
            Map.entry("aire_acondicionado", Categoria.ALTO),
            Map.entry("calefactor", Categoria.ALTO),
            Map.entry("secadora", Categoria.ALTO),
            Map.entry("horno_electrico", Categoria.ALTO),
            Map.entry("ducha_electrica", Categoria.ALTO),
            Map.entry("lavadora", Categoria.MEDIO),
            Map.entry("lavavajillas", Categoria.MEDIO),
            Map.entry("plancha", Categoria.MEDIO),
            Map.entry("microondas", Categoria.MEDIO),
            Map.entry("bomba_agua", Categoria.MEDIO),
            Map.entry("nevera", Categoria.BAJO),
            Map.entry("freezer", Categoria.BAJO),
            Map.entry("televisor", Categoria.BAJO),
            Map.entry("computadora", Categoria.BAJO),
            Map.entry("iluminacion_led", Categoria.BAJO),
            Map.entry("router", Categoria.BAJO),
            Map.entry("cargador_celular", Categoria.BAJO)
    );

    public static final Set<String> EQUIPOS_ALTO = nombresDe(Categoria.ALTO);
    public static final Set<String> EQUIPOS_MEDIO = nombresDe(Categoria.MEDIO);
    public static final Set<String> EQUIPOS_BAJO = nombresDe(Categoria.BAJO);
    public static final Set<String> EQUIPOS_PERMITIDOS = CATEGORIA_POR_NOMBRE.keySet();

    private static Set<String> nombresDe(Categoria categoria) {
        return CATEGORIA_POR_NOMBRE.entrySet().stream()
                .filter(entrada -> entrada.getValue() == categoria)
                .map(Map.Entry::getKey)
                .collect(Collectors.toUnmodifiableSet());
    }
}