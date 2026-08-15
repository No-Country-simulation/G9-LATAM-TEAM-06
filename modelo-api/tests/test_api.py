import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.main import (  # noqa: E402
    PrediccionRequest,
    _nivel_para,
    _preparar_datos,
    _umbral_para,
    app,
    validar_configuracion_modelos,
)


BASE_PAYLOAD = {
    "consumo_kwh": 520,
    "uso_horario_pico": True,
    "cantidad_equipos": 10,
    "tipo_inmueble": "Casa",
    "horas_alto_consumo": 7,
    "equipos_alto_consumo": 2,
    "equipos_medio_consumo": 3,
    "equipos_bajo_consumo": 5,
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.mark.parametrize(
    ("extras", "nivel"),
    [
        ({}, "basico"),
        ({"cantidad_personas": 4}, "parcial"),
        ({
            "cantidad_personas": 4,
            "area_m2": 120,
            "horas_aire_acondicionado": 4,
            "consumo_mes_anterior_kwh": 480,
            "dias_facturados": 30,
        }, "avanzado"),
    ],
)
def test_predict_enruta_y_retorna_contrato_completo(client, extras, nivel):
    response = client.post("/predict", json={**BASE_PAYLOAD, **extras})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["nivel_analisis"] == nivel
    assert body["origen_prediccion"] == "modelo_ml"
    assert body["modelo_version"]
    assert body["advertencias"] == []
    assert body["categoria"] in {"Eficiente", "Moderado", "Ineficiente"}
    assert 0 <= body["probabilidad"] <= 1
    assert body["recomendaciones"]
    for recomendacion in body["recomendaciones"]:
        assert 0 <= recomendacion["confianza"] <= 1
        assert recomendacion["factores_clave"]


def test_health_expone_versiones_y_contrato(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["contrato_validado"] is True
    assert body["models"]["energia"]["niveles"] == [
        "avanzado", "basico", "parcial"
    ]


def test_rechaza_distribucion_de_equipos_inconsistente(client):
    payload = {**BASE_PAYLOAD, "equipos_bajo_consumo": 4}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    assert "debe ser igual" in response.text


def test_datos_derivados_no_imputan_campos_ausentes():
    request = PrediccionRequest(**{**BASE_PAYLOAD, "cantidad_personas": 4})
    nivel = _nivel_para(request)
    datos = _preparar_datos(request, nivel)
    assert nivel == "parcial"
    assert datos["consumo_por_persona"] == 130
    assert str(datos["consumo_por_m2"]) == "nan"


def test_umbral_individual_tiene_precedencia():
    configuracion = {
        "umbral": 0.50,
        "umbrales": {"rec_a": 0.35},
    }
    assert _umbral_para("rec_a", configuracion) == 0.35
    assert _umbral_para("rec_b", configuracion) == 0.50


def test_validador_detecta_niveles_incompletos(tmp_path):
    metadata = {
        "nombre": "modelo",
        "version": "1",
        "niveles": {"basico": {"archivo": "modelo.joblib", "columnas_entrada": ["x"]}},
    }
    with pytest.raises(RuntimeError, match="Niveles"):
        validar_configuracion_modelos(metadata, tmp_path, "energia")
