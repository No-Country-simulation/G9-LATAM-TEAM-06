-- V8: Modelado 1:N usuario -> analisis y nombre/numeracion del analisis.
-- El ID tecnico autoincremental (analisis.id) NO es el identificador de negocio:
-- el campo nombre_o_numero_analisis guarda el nombre elegido por el usuario o
-- la numeracion correlativa autogenerada por usuario.

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

-- Poblar usuarios con los correos ya existentes en el historial
INSERT IGNORE INTO usuarios (email)
SELECT DISTINCT usuario_id
FROM analisis_energetico
WHERE usuario_id IS NOT NULL AND TRIM(usuario_id) <> '';

ALTER TABLE analisis_energetico
    ADD COLUMN usuario_fk BIGINT NULL,
    ADD COLUMN nombre_o_numero_analisis VARCHAR(120) NULL,
    ADD CONSTRAINT fk_analisis_usuario FOREIGN KEY (usuario_fk) REFERENCES usuarios(id);

-- Asociar los registros historicos con su usuario
UPDATE analisis_energetico a
JOIN usuarios u ON u.email = a.usuario_id
SET a.usuario_fk = u.id;

CREATE INDEX idx_analisis_usuario_fk ON analisis_energetico (usuario_fk);