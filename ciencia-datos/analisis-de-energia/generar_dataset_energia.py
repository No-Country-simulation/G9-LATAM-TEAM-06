"""
Genera un dataset sintético para el proyecto de análisis energético.

Salida:
    consumo_energetico.csv

Uso:
    python generar_dataset_energia.py
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


RANDOM_STATE = 42
NUM_REGISTROS = 8000
BASE_DIR = Path(__file__).resolve().parent
ARCHIVO_SALIDA = BASE_DIR / "data" / "raw" / "consumo_energetico.csv"


def normalizar_serie(serie: pd.Series) -> pd.Series:
    minimo = serie.min()
    maximo = serie.max()

    if maximo == minimo:
        return pd.Series(np.zeros(len(serie)), index=serie.index)

    return (serie - minimo) / (maximo - minimo)


def generar_dataset(
    numero_registros: int = NUM_REGISTROS,
    random_state: int = RANDOM_STATE,
) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)

    tipo_inmueble = rng.choice(
        ["Casa", "Apartamento", "Comercio", "Oficina"],
        size=numero_registros,
        p=[0.42, 0.32, 0.14, 0.12],
    )

    cantidad_personas = np.select(
        [tipo_inmueble == "Comercio", tipo_inmueble == "Oficina"],
        [rng.integers(1, 16, numero_registros), rng.integers(1, 31, numero_registros)],
        default=rng.integers(1, 8, numero_registros),
    )

    area_m2 = np.select(
        [
            tipo_inmueble == "Apartamento",
            tipo_inmueble == "Casa",
            tipo_inmueble == "Comercio",
            tipo_inmueble == "Oficina",
        ],
        [
            rng.integers(35, 181, numero_registros),
            rng.integers(60, 351, numero_registros),
            rng.integers(30, 421, numero_registros),
            rng.integers(30, 421, numero_registros),
        ],
        default=100,
    )

    # La mayor parte de los registros conserva cantidades habituales, pero una
    # cola amplia enseña al modelo a procesar instalaciones de hasta 500 equipos.
    cantidad_habitual = np.where(
        np.isin(tipo_inmueble, ["Comercio", "Oficina"]),
        rng.poisson(22, numero_registros),
        rng.poisson(10, numero_registros),
    )
    cantidad_amplia = rng.integers(1, 501, numero_registros)
    cantidad_equipos = np.where(
        rng.random(numero_registros) < 0.20,
        cantidad_amplia,
        cantidad_habitual,
    )
    cantidad_equipos = np.clip(cantidad_equipos, 1, 500)

    # Todos los equipos se distribuyen en categorías mutuamente excluyentes.
    # La distribución permite casos reales con cero equipos de alto consumo.
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

    horas_alto_consumo = rng.integers(0, 25, numero_registros)
    horas_aire_acondicionado = rng.integers(0, 13, numero_registros)
    uso_horario_pico = rng.choice(
        [True, False],
        size=numero_registros,
        p=[0.55, 0.45],
    )
    dias_facturados = rng.integers(28, 32, numero_registros)

    consumo_base = (
        25
        + cantidad_personas * rng.uniform(18, 38, numero_registros)
        + area_m2 * rng.uniform(0.30, 0.85, numero_registros)
        + equipos_alto_consumo * rng.uniform(18, 42, numero_registros)
        + equipos_medio_consumo * rng.uniform(5, 13, numero_registros)
        + equipos_bajo_consumo * rng.uniform(0.8, 4.0, numero_registros)
        + horas_alto_consumo * rng.uniform(8, 22, numero_registros)
        + horas_aire_acondicionado * rng.uniform(7, 18, numero_registros)
        + uso_horario_pico.astype(int) * rng.uniform(15, 55, numero_registros)
    )

    factor_inmueble = np.select(
        [
            tipo_inmueble == "Apartamento",
            tipo_inmueble == "Casa",
            tipo_inmueble == "Comercio",
            tipo_inmueble == "Oficina",
        ],
        [0.85, 1.00, 1.20, 1.15],
        default=1.0,
    )

    # Incluye una cola de consumos altos para que el modelo aprenda también
    # hogares o pequeños negocios con demanda energética extraordinaria.
    factor_demanda = rng.choice(
        [0.05, 0.25, 0.50, 1.0, 1.5, 2.5, 4.0, 8.0],
        size=numero_registros,
        p=[0.01, 0.015, 0.025, 0.77, 0.10, 0.05, 0.02, 0.01],
    )
    ruido = rng.normal(0, 35, numero_registros)
    consumo_kwh = np.clip(
        consumo_base * factor_inmueble * factor_demanda + ruido,
        40,
        5000,
    )

    variacion_anterior = rng.normal(1.0, 0.15, numero_registros)
    consumo_mes_anterior_kwh = np.clip(
        consumo_kwh / variacion_anterior,
        35,
        5000,
    )

    df = pd.DataFrame(
        {
            "consumo_kwh": consumo_kwh.round(2),
            "uso_horario_pico": uso_horario_pico,
            "cantidad_equipos": cantidad_equipos.astype(int),
            "tipo_inmueble": tipo_inmueble,
            "horas_alto_consumo": horas_alto_consumo.astype(int),
            "cantidad_personas": cantidad_personas.astype(int),
            "area_m2": area_m2.astype(float),
            "equipos_alto_consumo": equipos_alto_consumo.astype(int),
            "equipos_medio_consumo": equipos_medio_consumo.astype(int),
            "equipos_bajo_consumo": equipos_bajo_consumo.astype(int),
            "horas_aire_acondicionado": horas_aire_acondicionado.astype(int),
            "consumo_mes_anterior_kwh": consumo_mes_anterior_kwh.round(2),
            "dias_facturados": dias_facturados.astype(int),
        }
    )

    df["consumo_diario"] = (
        df["consumo_kwh"] / df["dias_facturados"]
    ).round(4)

    df["consumo_por_persona"] = (
        df["consumo_kwh"] / df["cantidad_personas"].clip(lower=1)
    ).round(4)

    df["consumo_por_m2"] = (
        df["consumo_kwh"] / df["area_m2"].clip(lower=1)
    ).round(4)

    df["variacion_mensual"] = (
        (df["consumo_kwh"] - df["consumo_mes_anterior_kwh"])
        / df["consumo_mes_anterior_kwh"].clip(lower=1)
    ).round(4)

    df["proporcion_equipos_alto_consumo"] = (
        df["equipos_alto_consumo"]
        / df["cantidad_equipos"].clip(lower=1)
    ).round(4)

    df["proporcion_equipos_medio_consumo"] = (
        df["equipos_medio_consumo"] / df["cantidad_equipos"].clip(lower=1)
    ).round(4)
    df["proporcion_equipos_bajo_consumo"] = (
        df["equipos_bajo_consumo"] / df["cantidad_equipos"].clip(lower=1)
    ).round(4)
    df["carga_relativa_equipos"] = (
        (
            df["equipos_alto_consumo"]
            + df["equipos_medio_consumo"] * 0.35
            + df["equipos_bajo_consumo"] * 0.10
        ) / df["cantidad_equipos"].clip(lower=1)
    ).round(4)

    # En el análisis básico mandan consumo, horas y horario pico. La cantidad y
    # mezcla de equipos aportan solo 10 %, por lo que no dominan el resultado.
    puntaje = (
        normalizar_serie(df["consumo_kwh"]) * 0.34
        + normalizar_serie(df["horas_alto_consumo"]) * 0.16
        + df["uso_horario_pico"].astype(int) * 0.10
        + normalizar_serie(df["cantidad_equipos"]) * 0.03
        + normalizar_serie(df["carga_relativa_equipos"]) * 0.07
        + normalizar_serie(df["consumo_por_persona"]) * 0.10
        + normalizar_serie(df["consumo_por_m2"]) * 0.08
        + normalizar_serie(df["horas_aire_acondicionado"]) * 0.04
        + normalizar_serie(df["variacion_mensual"].clip(-0.5, 1.0)) * 0.08
    )

    # Variación moderada para evitar etiquetas completamente deterministas.
    puntaje = np.clip(
        puntaje + rng.normal(0, 0.035, numero_registros),
        0,
        1,
    )

    limite_eficiente = float(puntaje.quantile(0.33))
    limite_moderado = float(puntaje.quantile(0.70))

    df["puntaje_ineficiencia"] = puntaje.round(4)
    df["categoria"] = pd.cut(
        puntaje,
        bins=[-np.inf, limite_eficiente, limite_moderado, np.inf],
        labels=["Eficiente", "Moderado", "Ineficiente"],
    ).astype(str)

    return df


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Genera el dataset sintético de clasificación energética"
    )
    parser.add_argument("--filas", type=int, default=NUM_REGISTROS)
    parser.add_argument("--semilla", type=int, default=RANDOM_STATE)
    parser.add_argument(
        "--salida",
        type=Path,
        default=ARCHIVO_SALIDA,
    )
    argumentos = parser.parse_args()

    if argumentos.filas < 300:
        raise ValueError("Se requieren al menos 300 filas")

    df = generar_dataset(
        numero_registros=argumentos.filas,
        random_state=argumentos.semilla,
    )
    argumentos.salida.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(argumentos.salida, index=False, encoding="utf-8")

    print(f"Dataset generado: {argumentos.salida.resolve()}")
    print(f"Registros: {len(df)}")
    print("\nDistribución de categorías:")
    print(df["categoria"].value_counts())
    print("\nPrimeros registros:")
    print(df.head())


if __name__ == "__main__":
    main()
