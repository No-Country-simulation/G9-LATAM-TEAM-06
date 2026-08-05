# Paquete de Ciencia de Datos para Google Colab

## Estructura que debe conservarse

```text
Notebook Hackathon/
├── analisis-de-energia/
│   ├── analisis_energia_ml.ipynb
│   ├── generar_dataset_energia.py
│   ├── data/raw/consumo_energetico.csv
│   └── models/
└── analisis-de-recomendaciones/
    ├── analisis_recomendaciones_ml.ipynb
    ├── generar_dataset_recomendaciones.py
    ├── data/raw/recomendaciones_energia.csv
    └── models/
```

## Cómo subirlo

1. Descarga `Notebook-Hackathon-Colab.zip`.
2. Descomprime el ZIP en tu computadora.
3. En Google Drive crea, si no existe, la carpeta `Notebook Hackathon`.
4. Sube dentro de ella las carpetas completas `analisis-de-energia` y
   `analisis-de-recomendaciones`.
5. No subas los archivos por separado ni cambies los nombres de las carpetas.

La ubicación recomendada es:

```text
Mi unidad/Notebook Hackathon/
```

Los notebooks también detectan estas ubicaciones:

```text
Mi unidad/ciencia-datos/
Mi unidad/
```

## Ejecución

1. Abre el notebook desde Google Drive con Google Colab.
2. Selecciona `Entorno de ejecución > Ejecutar todas`.
3. Autoriza el montaje de Google Drive cuando Colab lo solicite.
4. Comprueba que aparezca `Generador encontrado: True`.

Los notebooks instalan las mismas versiones de `pandas`, `scikit-learn` y
`joblib` utilizadas por `modelo-api`, evitando incompatibilidades al cargar los
archivos `.joblib` en Docker.

El notebook de energía regenera el dataset y exporta:

```text
analisis-de-energia/models/modelo_energia.joblib
analisis-de-energia/models/metadata_modelo.json
```

El notebook de recomendaciones exporta:

```text
analisis-de-recomendaciones/models/modelo_recomendaciones.joblib
analisis-de-recomendaciones/models/metadata_recomendaciones.json
```

Los resultados se guardan directamente en Google Drive. Después de entrenar,
descarga los dos archivos de cada carpeta `models/` y reemplaza sus copias en
`modelo-api/models/` para desplegarlos con FastAPI.
