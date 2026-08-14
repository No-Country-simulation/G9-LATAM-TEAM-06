"""Entrena recomendadores separados para análisis básico, parcial y avanzado."""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    f1_score,
    hamming_loss,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from generar_dataset_recomendaciones import RECOMENDACIONES


RANDOM_STATE = 42
BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "data" / "raw" / "recomendaciones_energia.csv"
MODELS_DIR = BASE_DIR / "models"
MODEL_PATHS = {
    "basico": MODELS_DIR / "modelo_recomendaciones_basico.joblib",
    "parcial": MODELS_DIR / "modelo_recomendaciones_parcial.joblib",
    "avanzado": MODELS_DIR / "modelo_recomendaciones_avanzado.joblib",
}
METADATA_PATH = MODELS_DIR / "metadata_recomendaciones.json"

BASIC_CLASSIFIER_FEATURES = [
    "consumo_kwh",
    "uso_horario_pico",
    "cantidad_equipos",
    "tipo_inmueble",
    "horas_alto_consumo",
]
EQUIPMENT_FEATURES = [
    "equipos_alto_consumo",
    "equipos_medio_consumo",
    "equipos_bajo_consumo",
    "proporcion_equipos_alto_consumo",
    "proporcion_equipos_medio_consumo",
    "proporcion_equipos_bajo_consumo",
    "carga_relativa_equipos",
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
BASIC_FEATURES = BASIC_CLASSIFIER_FEATURES + EQUIPMENT_FEATURES + ["categoria"]
ADVANCED_FEATURES = (
    BASIC_CLASSIFIER_FEATURES
    + ADVANCED_USER_FIELDS
    + EQUIPMENT_FEATURES
    + DERIVED_ADVANCED_FEATURES
    + ["categoria"]
)
TARGET_COLUMNS = list(RECOMENDACIONES)
CATEGORICAL_FEATURES = ["tipo_inmueble", "categoria"]


def metricas(y_real, probabilidades, umbral):
    predicciones = (probabilidades >= umbral).astype(int)
    return {
        "precision_micro": float(
            precision_score(
                y_real, predicciones, average="micro", zero_division=0
            )
        ),
        "recall_micro": float(
            recall_score(y_real, predicciones, average="micro", zero_division=0)
        ),
        "f1_micro": float(
            f1_score(y_real, predicciones, average="micro", zero_division=0)
        ),
        "f1_macro": float(
            f1_score(y_real, predicciones, average="macro", zero_division=0)
        ),
        "hamming_loss": float(hamming_loss(y_real, predicciones)),
    }


def buscar_umbral(y_real, probabilidades):
    return float(max(
        np.arange(0.30, 0.71, 0.05),
        key=lambda umbral: f1_score(
            y_real,
            (probabilidades >= umbral).astype(int),
            average="macro",
            zero_division=0,
        ),
    ))


def crear_preprocessor(columnas):
    numericas = [
        columna for columna in columnas
        if columna not in CATEGORICAL_FEATURES
    ]
    categoricas = [
        columna for columna in columnas
        if columna in CATEGORICAL_FEATURES
    ]
    return ColumnTransformer([
        ("numeric", StandardScaler(), numericas),
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            categoricas,
        ),
    ], sparse_threshold=0)


def entrenar_nivel(df, columnas):
    disponibles = df.dropna(subset=columnas + TARGET_COLUMNS).copy()
    if disponibles.empty:
        raise ValueError("No hay registros completos para entrenar este nivel")
    X = disponibles[columnas]
    y = disponibles[TARGET_COLUMNS].astype(int)
    train, temporal = train_test_split(
        disponibles.index,
        test_size=0.30,
        random_state=RANDOM_STATE,
        stratify=disponibles["categoria"],
    )
    validacion, test = train_test_split(
        temporal,
        test_size=0.50,
        random_state=RANDOM_STATE,
        stratify=disponibles.loc[temporal, "categoria"],
    )
    candidatos = {
        "regresion_logistica": OneVsRestClassifier(
            LogisticRegression(
                max_iter=2500,
                class_weight="balanced",
                random_state=RANDOM_STATE,
            )
        ),
        "random_forest": OneVsRestClassifier(
            RandomForestClassifier(
                n_estimators=250,
                max_depth=14,
                min_samples_leaf=3,
                class_weight="balanced",
                random_state=RANDOM_STATE,
                n_jobs=-1,
            )
        ),
    }
    pipelines = {}
    resultados = {}
    for nombre, modelo in candidatos.items():
        pipeline = Pipeline([
            ("preprocessor", clone(crear_preprocessor(columnas))),
            ("classifier", modelo),
        ])
        pipeline.fit(X.loc[train], y.loc[train])
        probabilidades = pipeline.predict_proba(X.loc[validacion])
        umbral = buscar_umbral(y.loc[validacion], probabilidades)
        resultados[nombre] = metricas(
            y.loc[validacion], probabilidades, umbral
        )
        resultados[nombre]["umbral"] = umbral
        pipelines[nombre] = pipeline

    mejor = max(resultados, key=lambda nombre: resultados[nombre]["f1_macro"])
    pipeline = pipelines[mejor]
    umbral = resultados[mejor]["umbral"]
    metricas_test = metricas(
        y.loc[test], pipeline.predict_proba(X.loc[test]), umbral
    )
    return mejor, pipeline, umbral, resultados[mejor], metricas_test, len(disponibles)


def entrenar_parcial(df):
    disponibles = df[df["nivel_datos"] == "parcial"].copy()
    X = disponibles[ADVANCED_FEATURES]
    y = disponibles[TARGET_COLUMNS].astype(int)
    train, temporal = train_test_split(
        disponibles.index,
        test_size=0.30,
        random_state=RANDOM_STATE,
        stratify=disponibles["categoria"],
    )
    validacion, test = train_test_split(
        temporal,
        test_size=0.50,
        random_state=RANDOM_STATE,
        stratify=disponibles.loc[temporal, "categoria"],
    )
    pipeline = Pipeline([
        ("preprocessor", crear_preprocessor(ADVANCED_FEATURES)),
        (
            "classifier",
            OneVsRestClassifier(
                HistGradientBoostingClassifier(
                    max_iter=180,
                    max_leaf_nodes=31,
                    learning_rate=0.08,
                    l2_regularization=0.2,
                    class_weight="balanced",
                    random_state=RANDOM_STATE,
                )
            ),
        ),
    ])
    pipeline.fit(X.loc[train], y.loc[train])
    probabilidades = pipeline.predict_proba(X.loc[validacion])
    umbral = buscar_umbral(y.loc[validacion], probabilidades)
    validacion_metricas = metricas(
        y.loc[validacion], probabilidades, umbral
    )
    validacion_metricas["umbral"] = umbral
    prueba_metricas = metricas(
        y.loc[test], pipeline.predict_proba(X.loc[test]), umbral
    )
    return (
        pipeline,
        umbral,
        validacion_metricas,
        prueba_metricas,
        len(disponibles),
    )


def guardar_atomico(modelo, ruta):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    temporal = ruta.with_suffix(".tmp.joblib")
    joblib.dump(modelo, temporal)
    temporal.replace(ruta)


def main():
    df = pd.read_csv(DATASET_PATH)
    requeridas = set(ADVANCED_FEATURES + TARGET_COLUMNS)
    faltantes = sorted(requeridas - set(df.columns))
    if faltantes:
        raise ValueError(f"Faltan columnas: {faltantes}")
    if not df["consumo_kwh"].between(40, 5000).all():
        raise ValueError("Hay consumos fuera del dominio de 40 a 5000 kWh")
    suma = df[
        ["equipos_alto_consumo", "equipos_medio_consumo", "equipos_bajo_consumo"]
    ].sum(axis=1)
    if not suma.equals(df["cantidad_equipos"]):
        raise ValueError("La distribución de equipos no suma cantidad_equipos")

    niveles = {}
    for nivel, columnas in {
        "basico": BASIC_FEATURES,
        "avanzado": ADVANCED_FEATURES,
    }.items():
        mejor, pipeline, umbral, validacion, prueba, registros = entrenar_nivel(
            df, columnas
        )
        guardar_atomico(pipeline, MODEL_PATHS[nivel])
        niveles[nivel] = {
            "archivo": MODEL_PATHS[nivel].name,
            "columnas_entrada": columnas,
            "modelo_seleccionado": mejor,
            "umbral": umbral,
            "metricas_validacion": validacion,
            "metricas_prueba": prueba,
            "registros_entrenamiento_disponibles": registros,
        }

    pipeline, umbral, validacion, prueba, registros = entrenar_parcial(df)
    guardar_atomico(pipeline, MODEL_PATHS["parcial"])
    niveles["parcial"] = {
        "archivo": MODEL_PATHS["parcial"].name,
        "columnas_entrada": ADVANCED_FEATURES,
        "modelo_seleccionado": "hist_gradient_boosting",
        "umbral": umbral,
        "metricas_validacion": validacion,
        "metricas_prueba": prueba,
        "registros_entrenamiento_disponibles": registros,
        "manejo_ausentes": "nativo_sin_imputacion",
    }

    metadata = {
        "nombre": "recomendador-energia-tres-niveles",
        "version": "2.1.0",
        "sin_imputacion": True,
        "regla_enrutamiento": (
            "usar el mismo nivel elegido por el clasificador de energía"
        ),
        "campos_avanzados_requeridos": ADVANCED_USER_FIELDS,
        "niveles": niveles,
        "columnas_objetivo": TARGET_COLUMNS,
        "catalogo_recomendaciones": RECOMENDACIONES,
        "tipos_inmueble": ["Casa", "Apartamento", "Comercio", "Oficina"],
        "dataset_simulado": True,
    }
    METADATA_PATH.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(niveles, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
