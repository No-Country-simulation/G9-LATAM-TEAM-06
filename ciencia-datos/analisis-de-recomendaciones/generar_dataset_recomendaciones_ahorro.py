"""Genera un dataset sintético para entrenar recomendaciones energéticas.

Las recomendaciones son etiquetas multiclase binarias (multietiqueta): una
misma observación puede activar varias acciones. Los criterios son simulados y
deben documentarse como reglas de negocio del MVP, no como asesoría oficial.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


RECOMENDACIONES = {
    "rec_reducir_horario_pico": (
        "Distribuir, cuando sea posible, el consumo fuera de los horarios de mayor demanda"
    ),
    "rec_revisar_equipos_alto_consumo": (
        "Identificar las principales fuentes de consumo y priorizar acciones de eficiencia energética"
    ),
    "rec_optimizar_aire_acondicionado": (
        "Reducir consumos innecesarios y ajustar la duración de las actividades de mayor demanda"
    ),
    "rec_reducir_consumo_por_persona": (
        "Promover hábitos de ahorro y dar seguimiento continuo al consumo"
    ),
    "rec_monitorear_incremento_mensual": (
        "Comparar periódicamente el consumo para detectar cambios y oportunidades de ahorro"
    ),
    "rec_mejorar_eficiencia_inmueble": (
        "Aplicar mejoras graduales que aumenten la eficiencia energética general"
    ),
    "rec_mantener_habitos": (
        "Mantener los buenos hábitos y monitorear el consumo periódicamente"
    ),
}

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT = BASE_DIR / "data" / "raw" / "recomendaciones_energia.csv"


def _sigmoid(valor: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(valor, -30, 30)))


def _generar_variables(filas: int, rng: np.random.Generator) -> pd.DataFrame:
    tipos = np.array(["Casa", "Apartamento", "Comercio", "Oficina"])
    tipo_inmueble = rng.choice(tipos, size=filas, p=[0.42, 0.32, 0.14, 0.12])

    parametros_personas = {
        "Casa": 4.0,
        "Apartamento": 2.8,
        "Comercio": 6.0,
        "Oficina": 9.0,
    }
    parametros_area = {
        "Casa": (135.0, 42.0),
        "Apartamento": (78.0, 24.0),
        "Comercio": (165.0, 62.0),
        "Oficina": (145.0, 48.0),
    }

    cantidad_personas = np.array(
        [
            max(1, rng.poisson(parametros_personas[tipo]))
            for tipo in tipo_inmueble
        ]
    )
    area_m2 = np.array(
        [
            rng.normal(*parametros_area[tipo])
            for tipo in tipo_inmueble
        ]
    )
    area_m2 = np.clip(area_m2, 25, 420).round(1)

    factor_actividad = np.where(
        np.isin(tipo_inmueble, ["Comercio", "Oficina"]),
        7,
        2,
    )
    cantidad_equipos = rng.poisson(
        3 + cantidad_personas * 1.5 + factor_actividad
    )
    cantidad_equipos = np.clip(cantidad_equipos, 2, 45)

    prob_equipo_alto = np.where(
        np.isin(tipo_inmueble, ["Comercio", "Oficina"]),
        0.28,
        0.18,
    )
    equipos_alto_consumo = rng.binomial(
        cantidad_equipos,
        prob_equipo_alto,
    )

    tiene_aire = rng.random(filas) < np.where(
        tipo_inmueble == "Apartamento",
        0.58,
        0.72,
    )
    horas_aire_acondicionado = np.where(
        tiene_aire,
        rng.beta(2.0, 3.2, filas) * 15,
        0.0,
    ).round(1)

    uso_horario_pico = rng.random(filas) < np.where(
        np.isin(tipo_inmueble, ["Casa", "Apartamento"]),
        0.62,
        0.48,
    )

    horas_alto_consumo = rng.normal(
        1.2
        + cantidad_equipos * 0.17
        + equipos_alto_consumo * 0.38
        + horas_aire_acondicionado * 0.22
        + uso_horario_pico * 1.4,
        1.7,
    )
    horas_alto_consumo = np.clip(horas_alto_consumo, 0, 24).round(1)

    dias_facturados = rng.integers(28, 32, size=filas)
    factor_tipo = np.select(
        [
            tipo_inmueble == "Comercio",
            tipo_inmueble == "Oficina",
            tipo_inmueble == "Casa",
        ],
        [120.0, 100.0, 35.0],
        default=15.0,
    )

    consumo_kwh = (
        35
        + cantidad_personas * 24
        + cantidad_equipos * 7.5
        + equipos_alto_consumo * 36
        + horas_aire_acondicionado * 10
        + horas_alto_consumo * 8
        + area_m2 * 0.28
        + uso_horario_pico * 22
        + factor_tipo
        + rng.normal(0, 38, filas)
    )
    consumo_kwh = np.clip(consumo_kwh, 45, 1800).round(1)

    cambio_mensual = np.clip(
        rng.normal(0.03, 0.16, filas)
        + uso_horario_pico * 0.025
        + (horas_aire_acondicionado > 8) * 0.04,
        -0.38,
        0.65,
    )
    consumo_mes_anterior_kwh = (
        consumo_kwh / (1 + cambio_mensual)
    ).round(1)

    consumo_por_persona = consumo_kwh / cantidad_personas
    consumo_por_m2 = consumo_kwh / area_m2
    variacion_mensual = (
        consumo_kwh - consumo_mes_anterior_kwh
    ) / consumo_mes_anterior_kwh
    proporcion_equipos_alto_consumo = (
        equipos_alto_consumo / cantidad_equipos
    )

    puntaje_ineficiencia = (
        consumo_por_persona / np.median(consumo_por_persona) * 0.24
        + consumo_por_m2 / np.median(consumo_por_m2) * 0.19
        + proporcion_equipos_alto_consumo * 0.90
        + horas_aire_acondicionado / 12 * 0.16
        + horas_alto_consumo / 12 * 0.16
        + uso_horario_pico * 0.13
        + np.maximum(variacion_mensual, 0) * 0.45
    )
    limite_eficiente, limite_ineficiente = np.quantile(
        puntaje_ineficiencia,
        [0.34, 0.68],
    )
    categoria = np.select(
        [
            puntaje_ineficiencia <= limite_eficiente,
            puntaje_ineficiencia <= limite_ineficiente,
        ],
        ["Eficiente", "Moderado"],
        default="Ineficiente",
    )

    return pd.DataFrame(
        {
            "consumo_kwh": consumo_kwh,
            "uso_horario_pico": uso_horario_pico,
            "cantidad_equipos": cantidad_equipos,
            "tipo_inmueble": tipo_inmueble,
            "horas_alto_consumo": horas_alto_consumo,
            "cantidad_personas": cantidad_personas,
            "area_m2": area_m2,
            "equipos_alto_consumo": equipos_alto_consumo,
            "horas_aire_acondicionado": horas_aire_acondicionado,
            "consumo_mes_anterior_kwh": consumo_mes_anterior_kwh,
            "dias_facturados": dias_facturados,
            "consumo_por_persona": consumo_por_persona.round(4),
            "consumo_por_m2": consumo_por_m2.round(4),
            "variacion_mensual": variacion_mensual.round(4),
            "proporcion_equipos_alto_consumo": (
                proporcion_equipos_alto_consumo.round(4)
            ),
            "categoria": categoria,
        }
    )


def _generar_recomendaciones_y_ahorros(
    datos: pd.DataFrame,
    rng: np.random.Generator,
    ruido: float,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    ineficiente = (datos["categoria"] == "Ineficiente").astype(float)
    eficiente = (datos["categoria"] == "Eficiente").astype(float)

    probabilidades = pd.DataFrame(index=datos.index)
    probabilidades["rec_reducir_horario_pico"] = _sigmoid(
        -3.2
        + datos["uso_horario_pico"].astype(float) * 3.4
        + datos["horas_alto_consumo"] * 0.18
    )
    probabilidades["rec_revisar_equipos_alto_consumo"] = _sigmoid(
        -3.0
        + datos["proporcion_equipos_alto_consumo"] * 7.5
        + datos["cantidad_equipos"] * 0.055
        + ineficiente * 0.55
    )
    probabilidades["rec_optimizar_aire_acondicionado"] = _sigmoid(
        -3.1
        + datos["horas_aire_acondicionado"] * 0.48
        + datos["consumo_por_m2"] * 0.10
        + ineficiente * 0.45
    )
    probabilidades["rec_reducir_consumo_por_persona"] = _sigmoid(
        -3.0
        + datos["consumo_por_persona"] * 0.012
        + ineficiente * 0.65
    )
    probabilidades["rec_monitorear_incremento_mensual"] = _sigmoid(
        -2.5
        + np.maximum(datos["variacion_mensual"], 0) * 9.5
        + ineficiente * 0.45
    )
    probabilidades["rec_mejorar_eficiencia_inmueble"] = _sigmoid(
        -3.2
        + datos["consumo_por_m2"] * 0.34
        + (datos["tipo_inmueble"].isin(["Casa", "Comercio"])).astype(float)
        * 0.35
        + ineficiente * 0.65
    )

    etiquetas = pd.DataFrame(
        rng.random(probabilidades.shape) < probabilidades.to_numpy(),
        columns=probabilidades.columns,
        index=datos.index,
    ).astype(int)

    if ruido > 0:
        mascara_ruido = rng.random(etiquetas.shape) < ruido
        etiquetas = etiquetas.mask(
            mascara_ruido,
            1 - etiquetas,
        ).astype(int)

    acciones = etiquetas.sum(axis=1)
    etiquetas["rec_mantener_habitos"] = (
        (acciones == 0)
        | ((eficiente == 1) & (acciones <= 1) & (rng.random(len(datos)) < 0.72))
    ).astype(int)

    # --- NUBES DE AHORRO BASE POR CADA RECOMENDACIÓN ---
    ahorros = pd.DataFrame(index=datos.index)

    # 1. Reducir horario pico
    ahorro_pico = (
        0.05 
        + (datos["uso_horario_pico"].astype(float) * 0.06) 
        + (datos["horas_alto_consumo"] / 24.0 * 0.07)
        + rng.normal(0, 0.008, len(datos))
    )
    ahorros["rec_reducir_horario_pico_ahorro"] = np.where(
        etiquetas["rec_reducir_horario_pico"] == 1,
        np.clip(ahorro_pico, 0.03, 0.22).round(4),
        0.0,
    )

    # 2. Revisar equipos de alto consumo
    ahorro_equipos = (
        0.06 
        + (datos["proporcion_equipos_alto_consumo"].fillna(0) * 0.15) 
        + (datos["equipos_alto_consumo"].fillna(0) * 0.01)
        + rng.normal(0, 0.01, len(datos))
    )
    ahorros["rec_revisar_equipos_alto_consumo_ahorro"] = np.where(
        etiquetas["rec_revisar_equipos_alto_consumo"] == 1,
        np.clip(ahorro_equipos, 0.04, 0.28).round(4),
        0.0,
    )

    # 3. Optimizar aire acondicionado
    ahorro_ac = (
        0.04 
        + (datos["horas_aire_acondicionado"].fillna(0) / 24.0 * 0.14) 
        + rng.normal(0, 0.01, len(datos))
    )
    ahorros["rec_optimizar_aire_acondicionado_ahorro"] = np.where(
        etiquetas["rec_optimizar_aire_acondicionado"] == 1,
        np.clip(ahorro_ac, 0.03, 0.25).round(4),
        0.0,
    )

    # 4. Reducir consumo por persona
    ahorro_persona = (
        0.03 
        + np.clip(datos["consumo_por_persona"].fillna(0) / 300.0, 0, 0.10)
        + rng.normal(0, 0.005, len(datos))
    )
    ahorros["rec_reducir_consumo_por_persona_ahorro"] = np.where(
        etiquetas["rec_reducir_consumo_por_persona"] == 1,
        np.clip(ahorro_persona, 0.02, 0.18).round(4),
        0.0,
    )

    # 5. Monitorear incremento mensual
    var_pos = np.maximum(datos["variacion_mensual"].fillna(0), 0)
    ahorro_incremento = (
        0.03 
        + (var_pos * 0.15) 
        + rng.normal(0, 0.005, len(datos))
    )
    ahorros["rec_monitorear_incremento_mensual_ahorro"] = np.where(
        etiquetas["rec_monitorear_incremento_mensual"] == 1,
        np.clip(ahorro_incremento, 0.02, 0.15).round(4),
        0.0,
    )

    # 6. Mejorar eficiencia del inmueble
    ahorro_inmueble = (
        0.04 
        + np.clip(datos["consumo_por_m2"].fillna(0) / 10.0, 0, 0.12)
        + rng.normal(0, 0.01, len(datos))
    )
    ahorros["rec_mejorar_eficiencia_inmueble_ahorro"] = np.where(
        etiquetas["rec_mejorar_eficiencia_inmueble"] == 1,
        np.clip(ahorro_inmueble, 0.03, 0.22).round(4),
        0.0,
    )

    # 7. Mantener hábitos
    # 1. Verificamos si la categoría es 'Eficiente' o 'Moderado' (insensible a mayúsculas/minúsculas)
    es_eficiente_o_moderado = datos["categoria"].str.lower().isin(["eficiente", "moderado"])

    # 2. Asignamos 0.15 (15%) si cumple la categoría, o la base previa (0.015) si fuera otra
    base_ahorro = np.where(es_eficiente_o_moderado, 0.15, 0.015)

    # 3. Sumamos la variabilidad aleatoria
    ahorro_mantener = base_ahorro + rng.normal(0, 0.003, len(datos))

    # 4. Asignamos condicionalmente si la recomendación está activa
    ahorros["rec_mantener_habitos_ahorro"] = np.where(
        etiquetas["rec_mantener_habitos"] == 1,
        # OJO: Se ajusta el tope de np.clip a 0.20 para permitir el 15% (0.15)
        np.clip(ahorro_mantener, 0.005, 0.20).round(4),
        0.0,
)

    return etiquetas, ahorros


def _simular_disponibilidad(
    datos: pd.DataFrame,
    rng: np.random.Generator,
) -> pd.DataFrame:
    resultado = datos.copy()
    aleatorio = rng.random(len(resultado))
    resultado["nivel_datos"] = np.select(
        [aleatorio < 0.30, aleatorio < 0.55],
        ["basico", "parcial"],
        default="avanzado",
    )

    dependencias = {
        "cantidad_personas": ["consumo_por_persona"],
        "area_m2": ["consumo_por_m2"],
        "equipos_alto_consumo": ["proporcion_equipos_alto_consumo"],
        "horas_aire_acondicionado": [],
        "consumo_mes_anterior_kwh": ["variacion_mensual"],
        "dias_facturados": [],
    }

    mascara_basica = resultado["nivel_datos"] == "basico"
    for campo, derivados in dependencias.items():
        resultado.loc[mascara_basica, [campo, *derivados]] = np.nan

    indices_parciales = resultado.index[
        resultado["nivel_datos"] == "parcial"
    ]
    campos_opcionales = list(dependencias)
    for indice in indices_parciales:
        cantidad_oculta = int(rng.integers(1, len(campos_opcionales)))
        ocultos = rng.choice(
            campos_opcionales,
            size=cantidad_oculta,
            replace=False,
        )
        for campo in ocultos:
            resultado.loc[indice, [campo, *dependencias[campo]]] = np.nan

    return resultado


def generar_dataset(
    filas: int,
    semilla: int,
    ruido: float,
) -> pd.DataFrame:
    if filas < 300:
        raise ValueError("Se requieren al menos 300 filas")
    if not 0 <= ruido <= 0.20:
        raise ValueError("El ruido debe estar entre 0 y 0.20")

    rng = np.random.default_rng(semilla)
    datos_completos = _generar_variables(filas, rng)
    recomendaciones, ahorros = _generar_recomendaciones_y_ahorros(datos_completos, rng, ruido)
    datos_disponibles = _simular_disponibilidad(datos_completos, rng)

    dataset = pd.concat([datos_disponibles, recomendaciones, ahorros], axis=1)
    dataset.insert(0, "id_registro", np.arange(1, filas + 1))
    return dataset


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Genera datos sintéticos para recomendaciones energéticas"
    )
    parser.add_argument("--filas", type=int, default=6000)
    parser.add_argument("--semilla", type=int, default=42)
    parser.add_argument("--ruido", type=float, default=0.03)
    parser.add_argument(
        "--salida",
        type=Path,
        default=DEFAULT_OUTPUT,
    )
    argumentos = parser.parse_args()

    dataset = generar_dataset(
        filas=argumentos.filas,
        semilla=argumentos.semilla,
        ruido=argumentos.ruido,
    )
    argumentos.salida.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(argumentos.salida, index=False, encoding="utf-8")

    columnas_recomendacion = list(RECOMENDACIONES)
    columnas_ahorro = [f"{c}_ahorro" for c in columnas_recomendacion]

    print(f"Dataset generado: {argumentos.salida}")
    print(f"Filas: {len(dataset)}")
    print("\nDistribución de niveles de datos:")
    print(dataset["nivel_datos"].value_counts(normalize=True).round(4))
    print("\nFrecuencia de recomendaciones:")
    print(dataset[columnas_recomendacion].mean().sort_values().round(4))
    print("\nPromedio de porcentaje de ahorro cuando aplica la recomendación:")
    for col_rec in columnas_recomendacion:
        col_ahorro = f"{col_rec}_ahorro"
        prom_ahorro = dataset[dataset[col_rec] == 1][col_ahorro].mean()
        print(f"  {col_ahorro}: {prom_ahorro:.2%}")


if __name__ == "__main__":
    main()