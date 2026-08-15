"""Genera datos, entrena los seis modelos y publica artefactos en modelo-api."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import joblib


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
ENERGIA_DIR = BASE_DIR / "analisis-de-energia"
RECOMENDACIONES_DIR = BASE_DIR / "analisis-de-recomendaciones"
API_MODELS_DIR = ROOT_DIR / "modelo-api" / "models"


def ejecutar(script: str, directorio: Path) -> None:
    print(f"\n==> {directorio.name}: {script}")
    subprocess.run(
        [sys.executable, script], cwd=directorio, check=True
    )


def publicar(metadata_path: Path) -> None:
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    API_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    for configuracion in metadata["niveles"].values():
        origen = metadata_path.parent / configuracion["archivo"]
        joblib.load(origen)
        temporal = API_MODELS_DIR / f".{origen.name}.tmp"
        shutil.copy2(origen, temporal)
        temporal.replace(API_MODELS_DIR / origen.name)
    shutil.copy2(metadata_path, API_MODELS_DIR / metadata_path.name)


def validar_publicacion() -> None:
    for nombre in ("metadata_modelo.json", "metadata_recomendaciones.json"):
        ruta = API_MODELS_DIR / nombre
        metadata = json.loads(ruta.read_text(encoding="utf-8"))
        if set(metadata["niveles"]) != {"basico", "parcial", "avanzado"}:
            raise RuntimeError(f"Niveles incompletos en {nombre}")
        for nivel, configuracion in metadata["niveles"].items():
            artefacto = API_MODELS_DIR / configuracion["archivo"]
            joblib.load(artefacto)
            print(f"OK {nombre}:{nivel} -> {artefacto.name}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sin-generar",
        action="store_true",
        help="Reutiliza los CSV existentes y solamente reentrena.",
    )
    parser.add_argument(
        "--componente",
        choices=("todos", "energia", "recomendaciones"),
        default="todos",
        help="Limita generación, entrenamiento y publicación a un componente.",
    )
    args = parser.parse_args()

    ejecutar_energia = args.componente in {"todos", "energia"}
    ejecutar_recomendaciones = args.componente in {"todos", "recomendaciones"}
    if not args.sin_generar and ejecutar_energia:
        ejecutar("generar_dataset_energia.py", ENERGIA_DIR)
    if not args.sin_generar and ejecutar_recomendaciones:
        ejecutar("generar_dataset_recomendaciones.py", RECOMENDACIONES_DIR)
    if ejecutar_energia:
        ejecutar("entrenar_modelo_energia.py", ENERGIA_DIR)
    if ejecutar_recomendaciones:
        ejecutar("entrenar_modelo_recomendaciones.py", RECOMENDACIONES_DIR)

    if ejecutar_energia:
        publicar(ENERGIA_DIR / "models" / "metadata_modelo.json")
    if ejecutar_recomendaciones:
        publicar(
            RECOMENDACIONES_DIR / "models" / "metadata_recomendaciones.json"
        )
    validar_publicacion()
    print("\nReentrenamiento y publicación completados.")


if __name__ == "__main__":
    main()
