const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_KEY = import.meta.env.VITE_API_KEY || "";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY,
  };
}

function handleResponse(respuesta) {
  if (!respuesta.ok) {
    throw new Error(`Error en el servidor: ${respuesta.status}`);
  }
  return respuesta.json();
}

export async function crearAnalisisEnergetico(datos, usuarioId) {
  const body = { ...datos, usuarioId: usuarioId || "invitado" };

  try {
    const respuesta = await fetch(`${API_BASE_URL}/analisis-energetico`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    return handleResponse(respuesta);
  } catch (error) {
    console.error("Error al crear análisis:", error);
    throw error;
  }
}

export async function obtenerAnalisisPorId(id) {
  try {
    const respuesta = await fetch(`${API_BASE_URL}/analisis-energetico/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });

    return handleResponse(respuesta);
  } catch (error) {
    console.error("Error al obtener análisis:", error);
    throw error;
  }
}

export async function listarAnalisisPorUsuario(usuarioId, categoria = null, page = 0, size = 10) {
  const params = new URLSearchParams({
    usuarioId,
    page: page.toString(),
    size: size.toString(),
  });
  if (categoria) params.append("categoria", categoria);

  try {
    const respuesta = await fetch(`${API_BASE_URL}/analisis-energetico?${params}`, {
      method: "GET",
      headers: getHeaders(),
    });

    return handleResponse(respuesta);
  } catch (error) {
    console.error("Error al listar análisis:", error);
    throw error;
  }
}

export async function obtenerAnalisisEnergetico(datosCustom = null, usuarioId = "invitado") {
  const payloadPorDefecto = {
    consumo_kwh: 250,
    tipo_inmueble: "Residencial",
    cantidad_equipos: 5,
    horas_alto_consumo: 6,
    uso_horario_pico: true,
  };

  const bodyAEnviar = datosCustom || payloadPorDefecto;
  return crearAnalisisEnergetico(bodyAEnviar, usuarioId);
}