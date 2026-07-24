CREATE TABLE analisis_energetico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consumo_kwh INT NOT NULL,
    uso_horario_pico BOOLEAN NOT NULL,
    cantidad_equipos INT NOT NULL,
    tipo_inmueble VARCHAR(50) NOT NULL,
    horas_alto_consumo INT NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    probabilidad DECIMAL(3,2) NOT NULL,
    costo_estimado DECIMAL(10,2) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);