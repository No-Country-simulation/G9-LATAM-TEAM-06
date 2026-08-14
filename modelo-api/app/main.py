import json
from pathlib import Path
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator, model_validator


BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
ENERGY_METADATA_PATH = MODELS_DIR / "metadata_modelo.json"
RECOMMENDATION_METADATA_PATH = MODELS_DIR / "metadata_recomendaciones.json"

app = FastAPI(
    title="API de análisis y recomendaciones de energía",
    version="2.1.0",
)


LIMITES_POR_INMUEBLE = {
    "Casa": {
        "cantidad_equipos": (1, 500),
        "cantidad_personas": (1, 7),
        "area_m2": (60.0, 350.0),
    },
    "Apartamento": {
        "cantidad_equipos": (1, 500),
        "cantidad_personas": (1, 7),
        "area_m2": (35.0, 180.0),
    },
    "Comercio": {
        "cantidad_equipos": (1, 500),
        "cantidad_personas": (1, 15),
        "area_m2": (30.0, 420.0),
    },
    "Oficina": {
        "cantidad_equipos": (1, 500),
        "cantidad_personas": (1, 30),
        "area_m2": (30.0, 420.0),
    },
}

ADVANCED_FIELDS = [
    "cantidad_personas",
    "area_m2",
    "horas_aire_acondicionado",
    "consumo_mes_anterior_kwh",
    "dias_facturados",
]


class PrediccionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    consumo_kwh: int = Field(ge=40, le=5000, strict=True)
    uso_horario_pico: StrictBool
    cantidad_equipos: int = Field(ge=1, le=500, strict=True)
    tipo_inmueble: Literal["Casa", "Apartamento", "Comercio", "Oficina"]
    horas_alto_consumo: int = Field(ge=0, le=24, strict=True)
    cantidad_personas: int | None = Field(default=None, ge=1, le=30, strict=True)
    area_m2: float | None = Field(default=None, ge=30, le=420)
    equipos_alto_consumo: int = Field(ge=0, le=500, strict=True)
    equipos_medio_consumo: int = Field(ge=0, le=500, strict=True)
    equipos_bajo_consumo: int = Field(ge=0, le=500, strict=True)
    horas_aire_acondicionado: int | None = Field(default=None, ge=0, le=12, strict=True)
    consumo_mes_anterior_kwh: float | None = Field(default=None, ge=35, le=5000)
    dias_facturados: int | None = Field(default=None, ge=28, le=31, strict=True)

    @field_validator("area_m2", "consumo_mes_anterior_kwh", mode="before")
    @classmethod
    def validar_decimal_numerico(cls, valor):
        if valor is None:
            return valor
        if isinstance(valor, bool) or not isinstance(valor, (int, float)):
            raise ValueError("debe ser un número JSON")
        return valor

    @field_validator("area_m2", "consumo_mes_anterior_kwh")
    @classmethod
    def validar_maximo_dos_decimales(cls, valor):
        if valor is None:
            return valor
        representacion = format(valor, ".15g")
        if "." in representacion and len(representacion.rstrip("0").split(".")[1]) > 2:
            raise ValueError("admite máximo 2 decimales")
        return valor

    @model_validator(mode="after")
    def validar_dominio(self):
        suma_equipos = (
            self.equipos_alto_consumo
            + self.equipos_medio_consumo
            + self.equipos_bajo_consumo
        )
        if suma_equipos != self.cantidad_equipos:
            raise ValueError(
                "equipos_alto_consumo + equipos_medio_consumo + "
                "equipos_bajo_consumo debe ser igual a cantidad_equipos"
            )

        limites = LIMITES_POR_INMUEBLE[self.tipo_inmueble]
        for campo in ["cantidad_equipos", "cantidad_personas", "area_m2"]:
            valor = getattr(self, campo)
            if valor is None:
                continue
            minimo, maximo = limites[campo]
            if not minimo <= valor <= maximo:
                raise ValueError(
                    f"{campo} debe estar entre {minimo} y {maximo} "
                    f"para {self.tipo_inmueble}"
                )
        return self


class RecomendacionResponse(BaseModel):
    codigo: str
    texto: str
    confianza: float


class PrediccionResponse(BaseModel):
    categoria: str
    probabilidad: float
    nivel_analisis: Literal["basico", "parcial", "avanzado"]
    campos_imputados: list[str]
    recomendaciones: list[RecomendacionResponse]


def _cargar_niveles(metadata):
    return {
        nivel: joblib.load(MODELS_DIR / configuracion["archivo"])
        for nivel, configuracion in metadata["niveles"].items()
    }


@app.on_event("startup")
def cargar_modelos():
    with open(ENERGY_METADATA_PATH, encoding="utf-8") as archivo:
        app.state.metadata_energia = json.load(archivo)
    with open(RECOMMENDATION_METADATA_PATH, encoding="utf-8") as archivo:
        app.state.metadata_recomendaciones = json.load(archivo)

    app.state.modelos_energia = _cargar_niveles(app.state.metadata_energia)
    app.state.modelos_recomendaciones = _cargar_niveles(
        app.state.metadata_recomendaciones
    )
    print("Modelos básico, parcial y avanzado cargados sin imputación")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "modelo-energia-y-recomendaciones",
        "sin_imputacion": True,
        "models": {
            "energia": {
                "nombre": app.state.metadata_energia["nombre"],
                "version": app.state.metadata_energia["version"],
                "niveles": sorted(app.state.modelos_energia),
            },
            "recomendaciones": {
                "nombre": app.state.metadata_recomendaciones["nombre"],
                "version": app.state.metadata_recomendaciones["version"],
                "niveles": sorted(app.state.modelos_recomendaciones),
            },
        },
    }


def _nivel_para(request):
    presentes = sum(
        getattr(request, campo) is not None for campo in ADVANCED_FIELDS
    )
    if presentes == 0:
        return "basico"
    if presentes == len(ADVANCED_FIELDS):
        return "avanzado"
    return "parcial"


def _preparar_datos(request, nivel):
    datos = request.model_dump(exclude_none=True)
    datos["proporcion_equipos_alto_consumo"] = (
        request.equipos_alto_consumo / request.cantidad_equipos
    )
    datos["proporcion_equipos_medio_consumo"] = (
        request.equipos_medio_consumo / request.cantidad_equipos
    )
    datos["proporcion_equipos_bajo_consumo"] = (
        request.equipos_bajo_consumo / request.cantidad_equipos
    )
    datos["carga_relativa_equipos"] = (
        request.equipos_alto_consumo
        + request.equipos_medio_consumo * 0.35
        + request.equipos_bajo_consumo * 0.10
    ) / request.cantidad_equipos

    if nivel in {"parcial", "avanzado"}:
        for campo in ADVANCED_FIELDS:
            datos.setdefault(campo, np.nan)
        datos["consumo_por_persona"] = (
            request.consumo_kwh / request.cantidad_personas
            if request.cantidad_personas is not None
            else np.nan
        )
        datos["consumo_por_m2"] = (
            request.consumo_kwh / request.area_m2
            if request.area_m2 is not None
            else np.nan
        )
        datos["variacion_mensual"] = (
            (
                request.consumo_kwh
                - request.consumo_mes_anterior_kwh
            ) / request.consumo_mes_anterior_kwh
            if request.consumo_mes_anterior_kwh is not None
            else np.nan
        )
    return datos


def _crear_entrada(datos, columnas):
    return pd.DataFrame(
        [[datos[columna] for columna in columnas]],
        columns=columnas,
    )


@app.post("/predict", response_model=PrediccionResponse)
def predict(request: PrediccionRequest):
    nivel = _nivel_para(request)
    datos = _preparar_datos(request, nivel)

    metadata_energia_nivel = app.state.metadata_energia["niveles"][nivel]
    modelo_energia = app.state.modelos_energia[nivel]
    entrada_energia = _crear_entrada(
        datos, metadata_energia_nivel["columnas_entrada"]
    )
    categoria_predicha = modelo_energia.predict(entrada_energia)[0]
    probabilidades = modelo_energia.predict_proba(entrada_energia)[0]
    clases = modelo_energia.named_steps["classifier"].classes_
    posicion = list(clases).index(categoria_predicha)
    probabilidad = float(probabilidades[posicion])
    categoria_nombre = app.state.metadata_energia["mapeo_categorias"][
        str(int(categoria_predicha))
    ]

    datos["categoria"] = categoria_nombre
    metadata_recomendaciones = app.state.metadata_recomendaciones
    metadata_recomendaciones_nivel = metadata_recomendaciones["niveles"][nivel]
    modelo_recomendaciones = app.state.modelos_recomendaciones[nivel]
    entrada_recomendaciones = _crear_entrada(
        datos, metadata_recomendaciones_nivel["columnas_entrada"]
    )
    probabilidades_recomendaciones = modelo_recomendaciones.predict_proba(
        entrada_recomendaciones
    )[0]
    codigos = metadata_recomendaciones["columnas_objetivo"]
    umbral = float(metadata_recomendaciones_nivel["umbral"])

    requisitos = {
        "rec_revisar_equipos_alto_consumo": request.equipos_alto_consumo > 0,
        "rec_optimizar_equipos_medio_consumo": request.equipos_medio_consumo > 0,
        "rec_reducir_consumo_en_espera": request.equipos_bajo_consumo > 0,
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

    def aplicable(codigo):
        return requisitos.get(codigo, True)

    seleccionados = [
        indice
        for indice, confianza in enumerate(probabilidades_recomendaciones)
        if float(confianza) >= umbral and aplicable(codigos[indice])
    ]
    if not seleccionados:
        aplicables = [
            indice for indice, codigo in enumerate(codigos) if aplicable(codigo)
        ]
        seleccionados = [
            max(aplicables, key=lambda indice: probabilidades_recomendaciones[indice])
        ]

    indice_mantener = codigos.index("rec_mantener_habitos")
    if indice_mantener in seleccionados and len(seleccionados) > 1:
        seleccionados.remove(indice_mantener)

    recomendaciones = sorted(
        [
            RecomendacionResponse(
                codigo=codigos[indice],
                texto=metadata_recomendaciones["catalogo_recomendaciones"][
                    codigos[indice]
                ],
                confianza=round(float(probabilidades_recomendaciones[indice]), 4),
            )
            for indice in seleccionados
        ],
        key=lambda recomendacion: recomendacion.confianza,
        reverse=True,
    )

    return PrediccionResponse(
        categoria=categoria_nombre,
        probabilidad=round(probabilidad, 4),
        nivel_analisis=nivel,
        campos_imputados=[],
        recomendaciones=recomendaciones,
    )
