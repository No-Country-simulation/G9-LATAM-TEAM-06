ALTER TABLE analisis_energetico 
ADD COLUMN electrodomesticos_detalle JSON;

-- Índice para acelerar búsquedas por usuario (ya existe idx_analisis_usuario_id en V2)