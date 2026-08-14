# Model card — clasificación energética v3.0.0

## Propósito

Clasificar un registro como `Eficiente`, `Moderado` o `Ineficiente`. Es una ayuda para priorizar acciones; no sustituye una auditoría energética ni una medición certificada.

## Datos y modelos

El dataset contiene 8,000 registros sintéticos reproducibles y cuatro tipos de inmueble. Básico y avanzado seleccionan el mejor candidato entre regresión logística, árbol y random forest. Parcial usa HistGradientBoosting, que admite campos ausentes sin imputación.

## Métricas de prueba

| Nivel | Accuracy | F1 macro |
|---|---:|---:|
| Básico | 0.814 | 0.818 |
| Parcial | 0.789 | 0.795 |
| Avanzado | 0.821 | 0.825 |

La estabilidad se midió con semillas 17, 42 y 73. El F1 macro medio fue 0.820 ± 0.008 en básico y 0.831 ± 0.004 en avanzado. Los metadatos incluyen precision, recall y F1 por categoría, tipo de inmueble y rango de consumo.

## Entradas y límites

El dominio validado es 40–5,000 kWh y 1–500 equipos. Los campos avanzados son personas, área, horas de aire acondicionado, consumo anterior y días facturados. Los resultados fuera de esta población no están respaldados por estas métricas.
