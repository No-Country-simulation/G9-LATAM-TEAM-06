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
        ["Casa", "Departamento", "Pequeno negocio"],
        size=numero_registros,
        p=[0.45, 0.35, 0.20],
    )

    cantidad_personas = np.where(
        tipo_inmueble == "Pequeno negocio",
        rng.integers(1, 16, numero_registros),
        rng.integers(1, 8, numero_registros),
    )

    area_m2 = np.where(
        tipo_inmueble == "Departamento",
        rng.integers(35, 130, numero_registros),
        np.where(
            tipo_inmueble == "Casa",
            rng.integers(60, 300, numero_registros),
            rng.integers(30, 250, numero_registros),
        ),
    )

    cantidad_equipos = np.where(
        tipo_inmueble == "Pequeno negocio",
        rng.integers(5, 40, numero_registros),
        rng.integers(3, 25, numero_registros),
    )

    equipos_alto_consumo = np.minimum(
        rng.integers(0, 10, numero_registros),
        cantidad_equipos,
    )

    horas_alto_consumo = rng.integers(0, 15, numero_registros)
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
        + cantidad_equipos * rng.uniform(2.5, 8.0, numero_registros)
        + equipos_alto_consumo * rng.uniform(18, 42, numero_registros)
        + horas_alto_consumo * rng.uniform(8, 22, numero_registros)
        + horas_aire_acondicionado * rng.uniform(7, 18, numero_registros)
        + uso_horario_pico.astype(int) * rng.uniform(15, 55, numero_registros)
    )

    factor_inmueble = np.select(
        [
            tipo_inmueble == "Departamento",
            tipo_inmueble == "Casa",
            tipo_inmueble == "Pequeno negocio",
        ],
        [0.85, 1.00, 1.20],
        default=1.0,
    )

    # Incluye una cola de consumos altos para que el modelo aprenda también
    # hogares o pequeños negocios con demanda energética extraordinaria.
    factor_demanda = rng.choice(
        [1.0, 1.5, 2.5, 4.0],
        size=numero_registros,
        p=[0.82, 0.10, 0.06, 0.02],
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

    # Los cinco campos obligatorios aportan el 50 % del puntaje. Esto permite
    # producir una clasificación básica coherente aun sin datos avanzados.
    puntaje = (
        normalizar_serie(df["consumo_kwh"]) * 0.25
        + normalizar_serie(df["cantidad_equipos"]) * 0.10
        + normalizar_serie(df["horas_alto_consumo"]) * 0.10
        + df["uso_horario_pico"].astype(int) * 0.05
        + normalizar_serie(df["consumo_por_persona"]) * 0.15
        + normalizar_serie(df["consumo_por_m2"]) * 0.12
        + normalizar_serie(df["equipos_alto_consumo"]) * 0.08
        + normalizar_serie(df["horas_aire_acondicionado"]) * 0.05
        + normalizar_serie(df["variacion_mensual"].clip(-0.5, 1.0)) * 0.10
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
