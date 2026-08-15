-- V9: Contador correlativo de análisis por usuario.
-- Garantiza una numeración única, estable y atómica para "Análisis N",
-- incluso con solicitudes concurrentes o tras borrar historial.

ALTER TABLE usuarios
    ADD COLUMN contador_analisis INT NOT NULL DEFAULT 0;

-- Poblar con la cantidad de análisis existentes para continuar la numeración
UPDATE usuarios u
SET u.contador_analisis = (
    SELECT COUNT(*)
    FROM analisis_energetico a
    WHERE a.usuario_fk = u.id
);
