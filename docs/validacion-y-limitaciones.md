# Validación y limitaciones

## Evidencia automatizada

- FastAPI: contrato real con los seis joblib, enrutamiento de tres niveles, validación de dominio, campos derivados, umbrales individuales y detección de artefactos incompletos.
- Spring: servicios, fallback, persistencia y DTOs.
- Angular: compilación de producción y pruebas de servicios/componentes.
- CI: ejecuta las tres capas y construye la imagen del microservicio ML.

## Limitaciones conocidas

1. Los datos son sintéticos. Son reproducibles y apropiados para la demostración del hackathon, pero las métricas no prueban desempeño en hogares reales.
2. No existe todavía calibración externa por país, clima, estación o tarifa eléctrica.
3. Algunos segmentos tienen menos muestras; deben interpretarse junto con su soporte.
4. Una recomendación indica aplicabilidad, no garantiza un ahorro específico.
5. El modelo parcial suele rendir menos que el avanzado porque trabaja con información incompleta.

## Ruta a producción

Recolectar datos consentidos, anonimizar, crear un conjunto externo inmóvil, medir deriva, recalibrar probabilidades y umbrales, y definir revisión periódica. Los hashes SHA-256 del dataset y de cada artefacto permiten identificar exactamente qué versión produjo un resultado.
