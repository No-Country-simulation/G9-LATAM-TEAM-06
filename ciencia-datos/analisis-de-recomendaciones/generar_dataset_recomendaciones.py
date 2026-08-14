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
        "Priorizar el uso eficiente y mantenimiento de los equipos de mayor demanda"
    ),
    "rec_optimizar_equipos_medio_consumo": (
        "Programar y agrupar el uso de los equipos de consumo medio para evitar funcionamiento innecesario"
    ),
    "rec_reducir_consumo_en_espera": (
        "Desconectar o suspender los equipos de bajo consumo cuando no estén en uso para reducir consumos acumulados"
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

    limites_personas = {
        "Casa": 7,
        "Apartamento": 7,
        "Comercio": 15,
        "Oficina": 30,
    }
    cantidad_personas = np.array([
        rng.integers(1, limites_personas[tipo] + 1)
        for tipo in tipo_inmueble
    ])
    limites_area = {
        "Casa": (60.0, 350.0),
        "Apartamento": (35.0, 180.0),
        "Comercio": (30.0, 420.0),
        "Oficina": (30.0, 420.0),
    }
    area_m2 = np.array([
        rng.integers(int(limites_area[tipo][0]), int(limites_area[tipo][1]) + 1)
        for tipo in tipo_inmueble
    ]).round(1)

    factor_actividad = np.where(
        np.isin(tipo_inmueble, ["Comercio", "Oficina"]),
        7,
        2,
    )
    cantidad_habitual = rng.poisson(
        3 + cantidad_personas * 1.5 + factor_actividad
    )
    cantidad_amplia = rng.integers(1, 501, filas)
    cantidad_equipos = np.where(
        rng.random(filas) < 0.20,
        cantidad_amplia,
        cantidad_habitual,
    )
    cantidad_equipos = np.clip(cantidad_equipos, 1, 500)

    probabilidades_equipos = {
        "Casa": [0.12, 0.33, 0.55],
        "Apartamento": [0.10, 0.30, 0.60],
        "Comercio": [0.18, 0.37, 0.45],
        "Oficina": [0.08, 0.42, 0.50],
    }
    distribucion_equipos = np.array([
        rng.multinomial(int(total), probabilidades_equipos[tipo])
        for total, tipo in zip(cantidad_equipos, tipo_inmueble)
    ])
    equipos_alto_consumo = distribucion_equipos[:, 0]
    equipos_medio_consumo = distribucion_equipos[:, 1]
    equipos_bajo_consumo = distribucion_equipos[:, 2]

    horas_aire_acondicionado = rng.integers(0, 13, filas).astype(float)

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

    consumo_base = (
        35
        + cantidad_personas * 24
        + equipos_alto_consumo * 36
        + equipos_medio_consumo * 10
        + equipos_bajo_consumo * 2.5
        + horas_aire_acondicionado * 10
        + horas_alto_consumo * 8
        + area_m2 * 0.28
        + uso_horario_pico * 22
        + factor_tipo
        + rng.normal(0, 38, filas)
    )
    factor_demanda = rng.choice(
        [0.05, 0.25, 0.50, 1.0, 1.5, 2.5, 4.0, 8.0],
        size=filas,
        p=[0.01, 0.015, 0.025, 0.77, 0.10, 0.05, 0.02, 0.01],
    )
    consumo_kwh = np.clip(consumo_base * factor_demanda, 40, 5000).round(1)

    cambio_mensual = np.clip(
        rng.normal(0.03, 0.16, filas)
        + uso_horario_pico * 0.025
        + (horas_aire_acondicionado > 8) * 0.04,
        -0.38,
        0.65,
    )
    consumo_mes_anterior_kwh = np.clip(
        consumo_kwh / (1 + cambio_mensual),
        35,
        5000,
    ).round(1)

    consumo_por_persona = consumo_kwh / cantidad_personas
    consumo_por_m2 = consumo_kwh / area_m2
    variacion_mensual = (
        consumo_kwh - consumo_mes_anterior_kwh
    ) / consumo_mes_anterior_kwh
    proporcion_equipos_alto_consumo = (
        equipos_alto_consumo / cantidad_equipos
    )
    proporcion_equipos_medio_consumo = equipos_medio_consumo / cantidad_equipos
    proporcion_equipos_bajo_consumo = equipos_bajo_consumo / cantidad_equipos
    carga_relativa_equipos = (
        equipos_alto_consumo
        + equipos_medio_consumo * 0.35
        + equipos_bajo_consumo * 0.10
    ) / cantidad_equipos

    puntaje_ineficiencia = (
        consumo_por_persona / np.median(consumo_por_persona) * 0.24
        + consumo_por_m2 / np.median(consumo_por_m2) * 0.19
        + carga_relativa_equipos * 0.32
        + horas_aire_acondicionado / 12 * 0.16
        + horas_alto_consumo / 24 * 0.16
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
            "equipos_medio_consumo": equipos_medio_consumo,
            "equipos_bajo_consumo": equipos_bajo_consumo,
            "horas_aire_acondicionado": horas_aire_acondicionado,
            "consumo_mes_anterior_kwh": consumo_mes_anterior_kwh,
            "dias_facturados": dias_facturados,
            "consumo_por_persona": consumo_por_persona.round(4),
            "consumo_por_m2": consumo_por_m2.round(4),
            "variacion_mensual": variacion_mensual.round(4),
            "proporcion_equipos_alto_consumo": (
                proporcion_equipos_alto_consumo.round(4)
            ),
            "proporcion_equipos_medio_consumo": (
                proporcion_equipos_medio_consumo.round(4)
            ),
            "proporcion_equipos_bajo_consumo": (
                proporcion_equipos_bajo_consumo.round(4)
            ),
            "carga_relativa_equipos": carga_relativa_equipos.round(4),
            "categoria": categoria,
        }
    )


def _generar_recomendaciones(
    datos: pd.DataFrame,
    rng: np.random.Generator,
    ruido: float,
) -> pd.DataFrame:
    ineficiente = (datos["categoria"] == "Ineficiente").astype(float)
    eficiente = (datos["categoria"] == "Eficiente").astype(float)

    probabilidades = pd.DataFrame(index=datos.index)
    probabilidades["rec_reducir_horario_pico"] = _sigmoid(
        -3.2
        + datos["uso_horario_pico"].astype(float) * 3.4
        + datos["horas_alto_consumo"] * 0.18
    )
    probabilidades["rec_revisar_equipos_alto_consumo"] = _sigmoid(
        -3.2
        + datos["proporcion_equipos_alto_consumo"] * 7.0
        + np.log1p(datos["equipos_alto_consumo"]) * 0.55
        + ineficiente * 0.55
    )
    probabilidades["rec_optimizar_equipos_medio_consumo"] = _sigmoid(
        -2.8
        + datos["proporcion_equipos_medio_consumo"] * 4.8
        + np.log1p(datos["equipos_medio_consumo"]) * 0.35
        + datos["horas_alto_consumo"] * 0.055
        + ineficiente * 0.35
    )
    probabilidades["rec_reducir_consumo_en_espera"] = _sigmoid(
        -2.7
        + datos["proporcion_equipos_bajo_consumo"] * 3.5
        + np.log1p(datos["equipos_bajo_consumo"]) * 0.30
        + ineficiente * 0.25
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

    # Las reglas sintéticas son deterministas fuera de una pequeña proporción
    # de ruido controlado; así el modelo aprende patrones reproducibles.
    etiquetas = pd.DataFrame(
        probabilidades.to_numpy() >= 0.50,
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
        | ((eficiente == 1) & (acciones <= 1))
    ).astype(int)

    return etiquetas


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
    recomendaciones = _generar_recomendaciones(datos_completos, rng, ruido)
    datos_disponibles = _simular_disponibilidad(datos_completos, rng)

    # No se entrena una acción que el servicio descartaría por falta del dato
    # que la hace aplicable. Esto evita enseñar objetivos imposibles al nivel
    # básico o a registros parciales.
    requisitos = {
        "rec_optimizar_aire_acondicionado": "horas_aire_acondicionado",
        "rec_reducir_consumo_por_persona": "cantidad_personas",
        "rec_monitorear_incremento_mensual": "consumo_mes_anterior_kwh",
    }
    for codigo, campo in requisitos.items():
        recomendaciones.loc[datos_disponibles[campo].isna(), codigo] = 0
    acciones = recomendaciones.drop(columns=["rec_mantener_habitos"]).sum(axis=1)
    eficiente = datos_completos["categoria"].eq("Eficiente")
    recomendaciones["rec_mantener_habitos"] = (
        (acciones == 0) | (eficiente & (acciones <= 1))
    ).astype(int)

    dataset = pd.concat([datos_disponibles, recomendaciones], axis=1)
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
    print(f"Dataset generado: {argumentos.salida}")
    print(f"Filas: {len(dataset)}")
    print("\nDistribución de niveles de datos:")
    print(dataset["nivel_datos"].value_counts(normalize=True).round(4))
    print("\nFrecuencia de recomendaciones:")
    print(dataset[columnas_recomendacion].mean().sort_values().round(4))


if __name__ == "__main__":
    main()
