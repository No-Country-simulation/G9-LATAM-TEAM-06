const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_KEY = import.meta.env.VITE_API_KEY || "";

export async function obtenerAnalisisEnergetico(datosCustom = null) {
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
        "X-API-KEY": API_KEY,
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