import json
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field, model_validator


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "modelo_energia.joblib"
METADATA_PATH = BASE_DIR / "models" / "metadata_modelo.json"

app = FastAPI(
    title="API del modelo de energía",
    version="1.0.0"
)


class PrediccionRequest(BaseModel):
    consumo_kwh: float = Field(gt=0)
    uso_horario_pico: bool
    cantidad_equipos: int = Field(gt=0)
    tipo_inmueble: str = Field(min_length=1)
    horas_alto_consumo: float = Field(ge=0, le=24)
    cantidad_personas: int = Field(gt=0)
    area_m2: float = Field(gt=0)
    equipos_alto_consumo: int = Field(ge=0)
    horas_aire_acondicionado: float = Field(ge=0, le=24)
    consumo_mes_anterior_kwh: float = Field(gt=0)
    dias_facturados: int = Field(gt=0)

    @model_validator(mode="after")
    def validar_equipos(self):
        if self.equipos_alto_consumo > self.cantidad_equipos:
            raise ValueError(
                "equipos_alto_consumo no puede ser mayor que cantidad_equipos"
            )

        return self


class PrediccionResponse(BaseModel):
    categoria: str
    probabilidad: float


@app.on_event("startup")
def cargar_modelo():
    app.state.modelo = joblib.load(MODEL_PATH)

    with open(METADATA_PATH, encoding="utf-8") as archivo:
        app.state.metadata = json.load(archivo)

    print("Modelo cargado correctamente")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "modelo-energia",
        "model": app.state.metadata["nombre"],
        "version": app.state.metadata["version"],
        "model_loaded": app.state.modelo is not None
    }


@app.post("/predict", response_model=PrediccionResponse)
def predict(request: PrediccionRequest):
    datos = request.model_dump()

    # Variables calculadas exactamente como en el entrenamiento
    datos["consumo_diario"] = (
        request.consumo_kwh / request.dias_facturados
    )

    datos["consumo_por_persona"] = (
        request.consumo_kwh / request.cantidad_personas
    )

    datos["consumo_por_m2"] = (
        request.consumo_kwh / request.area_m2
    )

    datos["variacion_mensual"] = (
        request.consumo_kwh - request.consumo_mes_anterior_kwh
    ) / request.consumo_mes_anterior_kwh

    datos["proporcion_equipos_alto_consumo"] = (
        request.equipos_alto_consumo / request.cantidad_equipos
    )

    # Mantiene el mismo orden de columnas utilizado durante el entrenamiento
    columnas = app.state.metadata["columnas_entrada"]

    entrada = pd.DataFrame(
        [datos],
        columns=columnas
    )

    categoria = str(
        app.state.modelo.predict(entrada)[0]
    )

    probabilidades = app.state.modelo.predict_proba(entrada)[0]

    clases = app.state.modelo.named_steps["classifier"].classes_
    posicion_categoria = list(clases).index(categoria)

    probabilidad = float(
        probabilidades[posicion_categoria]
    )

    return PrediccionResponse(
        categoria=categoria,
        probabilidad=round(probabilidad, 4)
    )