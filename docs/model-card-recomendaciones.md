# Model card — recomendaciones v3.0.0

## Propósito

Priorizar hasta nueve acciones energéticas aplicables al registro. El problema es multilabel: varias acciones pueden ser correctas simultáneamente.

## Controles metodológicos

- La categoría real no es una entrada del recomendador; esto evita fuga de datos y diferencia entre entrenamiento e inferencia.
- Cada acción tiene un umbral propio optimizado por F1 en validación.
- Una acción que requiere un campo avanzado se etiqueta y muestra solo cuando ese campo está disponible.
- `rec_mantener_habitos` se elimina si existe una acción correctiva concreta.
- Cada salida incluye confianza y factores observables.

## Métricas de prueba

| Nivel | F1 macro | F1 micro | Hamming loss |
|---|---:|---:|---:|
| Básico (6 acciones aplicables) | 0.846 | 0.886 | 0.091 |
| Parcial | 0.853 | 0.900 | 0.061 |
| Avanzado | 0.891 | 0.928 | 0.055 |

Los metadatos incluyen métricas por recomendación y segmentos por inmueble, categoría y rango de consumo. El nivel básico se evalúa únicamente sobre sus seis acciones justificables; no se infieren datos avanzados ocultos.

## Uso responsable

La confianza representa la probabilidad estimada de que una acción aplique, no un porcentaje de ahorro. El ahorro económico se presenta por separado en el simulador y depende de los supuestos seleccionados por el usuario.
