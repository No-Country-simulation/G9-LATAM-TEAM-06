import json
import math
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field, model_validator


BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

ENERGY_MODEL_PATH = MODELS_DIR / "modelo_energia.joblib"
ENERGY_METADATA_PATH = MODELS_DIR / "metadata_modelo.json"
RECOMMENDATION_MODEL_PATH = MODELS_DIR / "modelo_recomendaciones.joblib"
RECOMMENDATION_METADATA_PATH = MODELS_DIR / "metadata_recomendaciones.json"

app = FastAPI(
    title="API de análisis y recomendaciones de energía",
    version="1.1.0"
)


class PrediccionRequest(BaseModel):
    consumo_kwh: float = Field(gt=0, le=5000)
    uso_horario_pico: bool
    cantidad_equipos: int = Field(gt=0)
    tipo_inmueble: str = Field(min_length=1)
    horas_alto_consumo: float = Field(ge=0, le=24)
    cantidad_personas: int | None = Field(default=None, gt=0)
    area_m2: float | None = Field(default=None, gt=0)
    equipos_alto_consumo: int | None = Field(default=None, ge=0)
    horas_aire_acondicionado: float | None = Field(
        default=None,
        ge=0,
        le=24
    )
    consumo_mes_anterior_kwh: float | None = Field(default=None, gt=0)
    dias_facturados: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validar_equipos(self):
        if (
            self.equipos_alto_consumo is not None
            and self.equipos_alto_consumo > self.cantidad_equipos
        ):
            raise ValueError(
                "equipos_alto_consumo no puede ser mayor que cantidad_equipos"
            )

        return self


class RecomendacionResponse(BaseModel):
    codigo: str
    texto: str
    confianza: float


class PrediccionResponse(BaseModel):
    categoria: str
    probabilidad: float
    nivel_analisis: str
    campos_imputados: list[str]
    recomendaciones: list[RecomendacionResponse]


@app.on_event("startup")
def cargar_modelos():
    app.state.modelo_energia = joblib.load(ENERGY_MODEL_PATH)
    app.state.modelo_recomendaciones = joblib.load(
        RECOMMENDATION_MODEL_PATH
    )

    with open(ENERGY_METADATA_PATH, encoding="utf-8") as archivo:
        app.state.metadata_energia = json.load(archivo)

    with open(
        RECOMMENDATION_METADATA_PATH,
        encoding="utf-8"
    ) as archivo:
        app.state.metadata_recomendaciones = json.load(archivo)

    print("Modelos de energía y recomendaciones cargados correctamente")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "modelo-energia-y-recomendaciones",
        "models": {
            "energia": {
                "nombre": app.state.metadata_energia["nombre"],
                "version": app.state.metadata_energia["version"],
                "cargado": app.state.modelo_energia is not None,
            },
            "recomendaciones": {
                "nombre": app.state.metadata_recomendaciones["nombre"],
                "version": app.state.metadata_recomendaciones["version"],
                "cargado": app.state.modelo_recomendaciones is not None,
            },
        },
    }


@app.post("/predict", response_model=PrediccionResponse)
def predict(request: PrediccionRequest):
    datos_originales = request.model_dump()

    campos_avanzados = [
        "cantidad_personas",
        "area_m2",
        "equipos_alto_consumo",
        "horas_aire_acondicionado",
        "consumo_mes_anterior_kwh",
        "dias_facturados",
    ]

    campos_imputados = [
        campo
        for campo in campos_avanzados
        if datos_originales[campo] is None
    ]

    if not campos_imputados:
        nivel_analisis = "avanzado"
    elif len(campos_imputados) == len(campos_avanzados):
        nivel_analisis = "basico"
    else:
        nivel_analisis = "parcial"

    datos = {
        campo: math.nan if valor is None else valor
        for campo, valor in datos_originales.items()
    }

    # Variables derivadas calculadas igual que durante el entrenamiento
    datos["consumo_por_persona"] = (
        request.consumo_kwh / request.cantidad_personas
        if request.cantidad_personas is not None
        else math.nan
    )

    datos["consumo_por_m2"] = (
        request.consumo_kwh / request.area_m2
        if request.area_m2 is not None
        else math.nan
    )

    datos["variacion_mensual"] = (
        (
            request.consumo_kwh
            - request.consumo_mes_anterior_kwh
        ) / request.consumo_mes_anterior_kwh
        if request.consumo_mes_anterior_kwh is not None
        else math.nan
    )

    datos["proporcion_equipos_alto_consumo"] = (
        request.equipos_alto_consumo / request.cantidad_equipos
        if request.equipos_alto_consumo is not None
        else math.nan
    )

    # Conserva las columnas y el orden usados durante el entrenamiento
    columnas = app.state.metadata_energia["columnas_entrada"]

    entrada = pd.DataFrame(
        [[datos[columna] for columna in columnas]],
        columns=columnas
    )

    # Se conserva el tipo numérico para buscar su probabilidad
    categoria_predicha = app.state.modelo_energia.predict(entrada)[0]
    probabilidades = app.state.modelo_energia.predict_proba(entrada)[0]

    clases = app.state.modelo_energia.named_steps["classifier"].classes_
    posicion_categoria = list(clases).index(categoria_predicha)
    probabilidad = float(probabilidades[posicion_categoria])

    codigo_categoria = str(int(categoria_predicha))

    categoria_nombre = app.state.metadata_energia[
        "mapeo_categorias"
    ][codigo_categoria]

    # El recomendador usa los mismos datos y la categoría producida
    # por el clasificador de energía.
    datos["categoria"] = categoria_nombre
    metadata_recomendaciones = app.state.metadata_recomendaciones
    columnas_recomendaciones = metadata_recomendaciones[
        "columnas_entrada"
    ]

    entrada_recomendaciones = pd.DataFrame(
        [[datos[columna] for columna in columnas_recomendaciones]],
        columns=columnas_recomendaciones
    )

    probabilidades_recomendaciones = (
        app.state.modelo_recomendaciones
        .predict_proba(entrada_recomendaciones)[0]
    )
    codigos_recomendaciones = metadata_recomendaciones[
        "columnas_objetivo"
    ]
    umbral = float(metadata_recomendaciones["umbral"])

    requisitos_recomendaciones = {
        "rec_optimizar_aire_acondicionado": (
            request.horas_aire_acondicionado is not None
            and request.horas_aire_acondicionado > 0
        ),
        "rec_reducir_consumo_por_persona": (
            request.cantidad_personas is not None
        ),
        "rec_monitorear_incremento_mensual": (
            request.consumo_mes_anterior_kwh is not None
        ),
    }

    def recomendacion_aplicable(codigo: str) -> bool:
        return requisitos_recomendaciones.get(codigo, True)

    indices_seleccionados = [
        indice
        for indice, confianza in enumerate(
            probabilidades_recomendaciones
        )
        if float(confianza) >= umbral
        and recomendacion_aplicable(codigos_recomendaciones[indice])
    ]

    # Si ninguna supera el umbral, devuelve la recomendación aplicable
    # con mayor confianza, sin asumir datos que el usuario no proporcionó.
    if not indices_seleccionados:
        indices_aplicables = [
            indice
            for indice, codigo in enumerate(codigos_recomendaciones)
            if recomendacion_aplicable(codigo)
        ]
        indice_mayor = max(
            indices_aplicables,
            key=lambda indice: probabilidades_recomendaciones[indice]
        )
        indices_seleccionados = [indice_mayor]

    recomendaciones = sorted(
        [
            RecomendacionResponse(
                codigo=codigos_recomendaciones[indice],
                texto=metadata_recomendaciones[
                    "catalogo_recomendaciones"
                ][codigos_recomendaciones[indice]],
                confianza=round(
                    float(probabilidades_recomendaciones[indice]),
                    4
                ),
            )
            for indice in indices_seleccionados
        ],
        key=lambda recomendacion: recomendacion.confianza,
        reverse=True,
    )

    return PrediccionResponse(
        categoria=categoria_nombre,
        probabilidad=round(probabilidad, 4),
        nivel_analisis=nivel_analisis,
        campos_imputados=campos_imputados,
        recomendaciones=recomendaciones,
    )
