-- V5: Índice compuesto para optimizar consultas de historial por usuario y fecha
CREATE INDEX idx_analisis_usuario_fecha ON analisis_energetico (usuario_id, creado_en DESC);