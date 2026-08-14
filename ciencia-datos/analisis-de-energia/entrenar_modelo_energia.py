"""Entrena clasificadores energéticos separados para análisis básico, parcial y avanzado."""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier


RANDOM_STATE = 42
BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "data" / "raw" / "consumo_energetico.csv"
MODELS_DIR = BASE_DIR / "models"
MODEL_PATHS = {
    "basico": MODELS_DIR / "modelo_energia_basico.joblib",
    "parcial": MODELS_DIR / "modelo_energia_parcial.joblib",
    "avanzado": MODELS_DIR / "modelo_energia_avanzado.joblib",
}
METADATA_PATH = MODELS_DIR / "metadata_modelo.json"

MAPEO_CATEGORIAS = {"Ineficiente": 0, "Moderado": 1, "Eficiente": 2}
MAPEO_CATEGORIAS_INVERSO = {
    valor: clave for clave, valor in MAPEO_CATEGORIAS.items()
}
TIPOS_INMUEBLE = ["Casa", "Apartamento", "Comercio", "Oficina"]

BASIC_FEATURES = [
    "consumo_kwh",
    "uso_horario_pico",
    "cantidad_equipos",
    "tipo_inmueble",
    "horas_alto_consumo",
]
ADVANCED_USER_FIELDS = [
    "cantidad_personas",
    "area_m2",
    "horas_aire_acondicionado",
    "consumo_mes_anterior_kwh",
    "dias_facturados",
]
DERIVED_ADVANCED_FEATURES = [
    "consumo_por_persona",
    "consumo_por_m2",
    "variacion_mensual",
]
ADVANCED_FEATURES = (
    BASIC_FEATURES + ADVANCED_USER_FIELDS + DERIVED_ADVANCED_FEATURES
)
DEPENDENCIAS_AVANZADAS = {
    "cantidad_personas": ["consumo_por_persona"],
    "area_m2": ["consumo_por_m2"],
    "horas_aire_acondicionado": [],
    "consumo_mes_anterior_kwh": ["variacion_mensual"],
    "dias_facturados": [],
}


def crear_pipeline(modelo, columnas):
    categoricas = ["tipo_inmueble"]
    numericas = [columna for columna in columnas if columna not in categoricas]
    preprocessor = ColumnTransformer([
        ("numeric", StandardScaler(), numericas),
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            categoricas,
        ),
    ], sparse_threshold=0)
    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", clone(modelo)),
    ])


def evaluar_nivel(df, y, train, test, columnas, candidatos):
    X = df[columnas]
    if X.isna().any().any():
        raise ValueError(
            "El entrenamiento no admite valores ausentes ni imputación: "
            f"{X.columns[X.isna().any()].tolist()}"
        )

    resultados = {}
    pipelines = {}
    for nombre, modelo in candidatos.items():
        pipeline = crear_pipeline(modelo, columnas)
        pipeline.fit(X.loc[train], y.loc[train])
        predicciones = pipeline.predict(X.loc[test])
        resultados[nombre] = {
            "accuracy": float(accuracy_score(y.loc[test], predicciones)),
            "f1_macro": float(
                f1_score(y.loc[test], predicciones, average="macro")
            ),
        }
        pipelines[nombre] = pipeline

    mejor = max(resultados, key=lambda nombre: resultados[nombre]["f1_macro"])
    return mejor, pipelines[mejor], resultados


def crear_datos_parciales(df, y, indices, repeticiones, semilla):
    """Oculta de uno a cuatro grupos avanzados sin inventar reemplazos."""
    rng = np.random.default_rng(semilla)
    entradas = []
    objetivos = []
    campos = list(DEPENDENCIAS_AVANZADAS)

    for _ in range(repeticiones):
        parcial = df.loc[indices, ADVANCED_FEATURES].copy()
        for indice in parcial.index:
            cantidad_presentes = int(rng.integers(1, len(campos)))
            presentes = set(
                rng.choice(campos, size=cantidad_presentes, replace=False)
            )
            for campo, derivados in DEPENDENCIAS_AVANZADAS.items():
                if campo not in presentes:
                    parcial.loc[indice, [campo, *derivados]] = np.nan
        entradas.append(parcial.reset_index(drop=True))
        objetivos.append(y.loc[indices].reset_index(drop=True))

    return (
        pd.concat(entradas, ignore_index=True),
        pd.concat(objetivos, ignore_index=True),
    )


def entrenar_parcial(df, y, train, test):
    X_train, y_train = crear_datos_parciales(
        df, y, train, repeticiones=2, semilla=RANDOM_STATE
    )
    X_test, y_test = crear_datos_parciales(
        df, y, test, repeticiones=1, semilla=RANDOM_STATE + 1
    )
    pipeline = crear_pipeline(
        HistGradientBoostingClassifier(
            max_iter=250,
            max_leaf_nodes=31,
            learning_rate=0.08,
            l2_regularization=0.2,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        ADVANCED_FEATURES,
    )
    pipeline.fit(X_train, y_train)
    predicciones = pipeline.predict(X_test)
    metricas = {
        "accuracy": float(accuracy_score(y_test, predicciones)),
        "f1_macro": float(f1_score(y_test, predicciones, average="macro")),
    }
    return pipeline, metricas


def guardar_atomico(modelo, ruta):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    temporal = ruta.with_suffix(".tmp.joblib")
    joblib.dump(modelo, temporal)
    temporal.replace(ruta)


def main():
    df = pd.read_csv(DATASET_PATH)
    requeridas = set(ADVANCED_FEATURES + ["categoria"])
    faltantes = sorted(requeridas - set(df.columns))
    if faltantes:
        raise ValueError(f"Faltan columnas: {faltantes}")

    tipos_encontrados = sorted(df["tipo_inmueble"].unique().tolist())
    if tipos_encontrados != sorted(TIPOS_INMUEBLE):
        raise ValueError(f"Tipos de inmueble inesperados: {tipos_encontrados}")
    if not df["consumo_kwh"].between(40, 5000).all():
        raise ValueError("Hay consumos fuera del rango de 40 a 5000 kWh")
    if df[ADVANCED_FEATURES].isna().any().any():
        raise ValueError("El dataset energético debe contener datos completos")

    y = df["categoria"].map(MAPEO_CATEGORIAS).astype(int)
    train, test = train_test_split(
        df.index,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    candidatos = {
        "regresion_logistica": LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "arbol_decision": DecisionTreeClassifier(
            max_depth=10,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=14,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    }

    configuraciones = {
        "basico": BASIC_FEATURES,
        "avanzado": ADVANCED_FEATURES,
    }
    niveles = {}
    for nivel, columnas in configuraciones.items():
        mejor, pipeline, resultados = evaluar_nivel(
            df, y, train, test, columnas, candidatos
        )
        guardar_atomico(pipeline, MODEL_PATHS[nivel])
        niveles[nivel] = {
            "archivo": MODEL_PATHS[nivel].name,
            "columnas_entrada": columnas,
            "modelo_seleccionado": mejor,
            "metricas": resultados[mejor],
            "resultados_candidatos": resultados,
        }

    pipeline_parcial, metricas_parciales = entrenar_parcial(
        df, y, train, test
    )
    guardar_atomico(pipeline_parcial, MODEL_PATHS["parcial"])
    niveles["parcial"] = {
        "archivo": MODEL_PATHS["parcial"].name,
        "columnas_entrada": ADVANCED_FEATURES,
        "modelo_seleccionado": "hist_gradient_boosting",
        "metricas": metricas_parciales,
        "manejo_ausentes": "nativo_sin_imputacion",
    }

    metadata = {
        "nombre": "clasificador-energia-tres-niveles",
        "version": "2.1.0",
        "sin_imputacion": True,
        "regla_enrutamiento": (
            "usar avanzado solo cuando los cinco campos avanzados estén "
            "completos; usar parcial con uno a cuatro; usar básico con cero"
        ),
        "campos_avanzados_requeridos": ADVANCED_USER_FIELDS,
        "niveles": niveles,
        "mapeo_categorias": {
            str(codigo): nombre
            for codigo, nombre in MAPEO_CATEGORIAS_INVERSO.items()
        },
        "tipos_inmueble": TIPOS_INMUEBLE,
        "limites_api_consumo_kwh": {"minimo": 40, "maximo": 5000},
        "limites_api_cantidad_equipos": {"minimo": 1, "maximo": 500},
        "tarifa_kwh": 0.75,
        "moneda": "BRL",
        "dataset_simulado": True,
    }
    METADATA_PATH.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(niveles, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
