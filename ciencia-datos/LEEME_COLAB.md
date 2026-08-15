# Ciencia de Datos en Google Colab

## Estructura recomendada

```text
Notebook Hackathon/
├── analisis-de-energia/
│   ├── analisis_energia_ml.ipynb
│   ├── generar_dataset_energia.py
│   ├── entrenar_modelo_energia.py
│   ├── data/raw/consumo_energetico.csv
│   └── models/
└── analisis-de-recomendaciones/
    ├── analisis_recomendaciones_ml.ipynb
    ├── generar_dataset_recomendaciones.py
    ├── entrenar_modelo_recomendaciones.py
    ├── data/raw/recomendaciones_energia.csv
    └── models/
```

Los notebooks sirven como evidencia de EDA, patrones, transformación,
entrenamiento y evaluación. Los scripts `entrenar_modelo_*.py` constituyen el
pipeline oficial reproducible que genera los artefactos v3 utilizados por la
aplicación.

## Ejecución en Colab

1. Conserva la estructura anterior dentro de Google Drive.
2. Abre cada notebook y ejecuta sus celdas de exploración.
3. Instala las versiones indicadas en `modelo-api/requirements.txt`.
4. Ejecuta los generadores y entrenadores desde la carpeta correspondiente.

```python
!python generar_dataset_energia.py
!python entrenar_modelo_energia.py
```

```python
!python generar_dataset_recomendaciones.py
!python entrenar_modelo_recomendaciones.py
```

## Artefactos vigentes

Clasificación:

```text
analisis-de-energia/models/modelo_energia_basico.joblib
analisis-de-energia/models/modelo_energia_parcial.joblib
analisis-de-energia/models/modelo_energia_avanzado.joblib
analisis-de-energia/models/metadata_modelo.json
```

Recomendaciones:

```text
analisis-de-recomendaciones/models/modelo_recomendaciones_basico.joblib
analisis-de-recomendaciones/models/modelo_recomendaciones_parcial.joblib
analisis-de-recomendaciones/models/modelo_recomendaciones_avanzado.joblib
analisis-de-recomendaciones/models/metadata_recomendaciones.json
```

Para publicar manualmente, copia estos ocho archivos a `modelo-api/models/`.
Desde el repositorio completo se recomienda usar `reentrenar_todo.py`, que
genera, valida y publica los artefactos automáticamente.

Los archivos legacy `modelo_energia.joblib` y
`modelo_recomendaciones.joblib` ya no forman parte del contrato v3.
