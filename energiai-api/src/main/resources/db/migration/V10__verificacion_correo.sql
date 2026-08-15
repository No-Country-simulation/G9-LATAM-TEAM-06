-- V10: Verificación de correo por código.
-- - usuarios.verificado: marca si el correo pasó la verificación por código (SMTP).
-- - codigos_verificacion: códigos enviados, hasheados, con expiración e intentos.

ALTER TABLE usuarios
    ADD COLUMN verificado BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS codigos_verificacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    codigo_hash VARCHAR(64) NOT NULL,
    ip_origen VARCHAR(45) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,
    intentos INT NOT NULL DEFAULT 0,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_codigos_verificacion_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE INDEX idx_codigos_verificacion_ip_creado
    ON codigos_verificacion (ip_origen, creado_en);