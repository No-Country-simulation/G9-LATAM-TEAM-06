# Reentrenamiento reproducible

Desde la raíz, con Python 3.12 y las dependencias de `modelo-api/requirements.txt`:

```bash
python ciencia-datos/reentrenar_todo.py
```

El comando genera ambas sábanas, entrena tres clasificadores y tres recomendadores, valida que los joblib abran y publica copias atómicas en `modelo-api/models`.

Opciones:

```bash
python ciencia-datos/reentrenar_todo.py --sin-generar
python ciencia-datos/reentrenar_todo.py --componente recomendaciones
python ciencia-datos/reentrenar_todo.py --sin-generar --componente energia
```

Los metadatos registran versión, columnas en orden, algoritmo seleccionado, métricas, umbrales, metodología, declaración de datos sintéticos y hashes. Un cambio de columnas o de objetivos requiere una nueva versión mayor y la ejecución del contrato FastAPI antes de publicar.
