const API_BASE_URL = "http://localhost:8080";

/**
 * Petición POST a /analisis-energetico con estructura válida para AnalisisRequest
 */
export async function obtenerAnalisisEnergetico(datosCustom = null) {
  // Datos de prueba por defecto si no le pasamos nada
  const payloadPorDefecto = {
    consumo_kwh: 250,
    tipo_inmueble: "Residencial",
    cantidad_equipos: 5,
    horas_alto_consumo: 6,
    uso_horario_pico: true,
  };

  const bodyAEnviar = datosCustom || payloadPorDefecto;

  try {
    const respuesta = await fetch(`${API_BASE_URL}/analisis-energetico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyAEnviar),
    });

    if (!respuesta.ok) {
      throw new Error(`Error en el servidor: ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    return datos;
  } catch (error) {
    console.error("Error al conectar con Energiai API:", error);
    throw error;
  }
}
