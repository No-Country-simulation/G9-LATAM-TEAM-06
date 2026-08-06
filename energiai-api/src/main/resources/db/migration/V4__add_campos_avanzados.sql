-- V4: Agregar campos avanzados para integración con modelo IA
ALTER TABLE analisis_energetico
    ADD COLUMN cantidad_personas INT NULL,
    ADD COLUMN area_m2 FLOAT NULL,
    ADD COLUMN equipos_alto_consumo INT NULL,
    ADD COLUMN horas_aire_acondicionado FLOAT NULL,
    ADD COLUMN consumo_mes_anterior_kwh FLOAT NULL,
    ADD COLUMN dias_facturados INT NULL;