ALTER TABLE analisis_energetico
    ADD COLUMN recomendaciones_json JSON NULL,
    ADD COLUMN nivel_analisis VARCHAR(20) NULL,
    ADD COLUMN campos_imputados_json JSON NULL;
