ALTER TABLE analisis_energetico
    ADD COLUMN recomendaciones_detalle_json JSON NULL,
    ADD COLUMN origen_prediccion VARCHAR(30) NULL,
    ADD COLUMN modelo_version VARCHAR(100) NULL,
    ADD COLUMN advertencias_json JSON NULL;
