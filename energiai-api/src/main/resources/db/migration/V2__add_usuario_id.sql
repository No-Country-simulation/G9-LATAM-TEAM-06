ALTER TABLE analisis_energetico 
ADD COLUMN usuario_id VARCHAR(100) NOT NULL DEFAULT 'DEFAULT_USER';

-- Índice para acelerar las búsquedas y paginación por usuario
CREATE INDEX idx_analisis_usuario_id ON analisis_energetico(usuario_id);