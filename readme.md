# EnergiAI

EnergiAI analiza consumo eléctrico de viviendas y pequeños negocios, clasifica su eficiencia y entrega recomendaciones explicables junto con una estimación económica. El proyecto integra Angular 21, Spring Boot/Java 21, FastAPI, seis modelos de ML, MySQL y Docker Compose.

## Capacidades

- Clasificación energética en tres niveles de datos: básico, parcial y avanzado.
- Recomendaciones multilabel con umbral independiente por acción.
- Factores clave, confianza, versión y origen de cada resultado.
- Reglas de respaldo explícitas cuando el servicio ML no está disponible.
- Historial, comparación de períodos, carga CSV, ranking y simulador de ahorro.
- Modo claro/oscuro en todas las secciones.

## Inicio rápido

1. Copia `.env.ejemplo` como `.env` y configura los secretos de `secrets/`.
2. Ejecuta `docker compose up --build -d`.
3. Abre `http://localhost`; la API Spring queda en `http://localhost:8090` y FastAPI en `http://localhost:8080`.

## Modelos

Los seis artefactos activos se entrenan con datos sintéticos reproducibles, opción permitida por el hackathon. No se presentan como mediciones reales. El recomendador v3 evita usar la categoría energética real como entrada, usa etiquetas compatibles con la disponibilidad de campos y optimiza un umbral por recomendación.

Reentrenamiento completo:

```bash
python ciencia-datos/reentrenar_todo.py
```

También admite `--sin-generar` y `--componente energia|recomendaciones`.

## Documentación

- [Índice](docs/indice.md)
- [Arquitectura](docs/arquitectura.md)
- [Model card: clasificación](docs/model-card-clasificacion.md)
- [Model card: recomendaciones](docs/model-card-recomendaciones.md)
- [Validación y limitaciones](docs/validacion-y-limitaciones.md)
- [Reentrenamiento](docs/reentrenamiento.md)
- [Ejecución de Ciencia de Datos en Colab](ciencia-datos/LEEME_COLAB.md)
