import React, { useState, useEffect } from "react";
import { listarAnalisisPorUsuario } from "../services/api";
import {
  History,
  Trash2,
  Calendar,
  DollarSign,
  Activity,
  Zap,
  RefreshCw,
} from "lucide-react";

function HistorialView({ usuario }) {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [tieneMas, setTieneMas] = useState(false);

  const usuarioActual = usuario || "Invitado";

  const cargarHistorial = async (page = 0, append = false) => {
    setCargando(true);
    setError(null);
    try {
      const data = await listarAnalisisPorUsuario(
        usuarioActual,
        null,
        page,
        10,
      );
      const nuevos = data.content.map((item) => ({
        id: item.id,
        fecha: new Date(item.creadoEn).toLocaleString(),
        usuario: usuarioActual,
        solicitud: {
          consumo_kwh: item.consumoKwh,
          tipo_inmueble: item.tipoInmueble,
          cantidad_equipos: item.cantidadEquipos,
          horas_alto_consumo: item.horasAltoConsumo,
          uso_horario_pico: item.usoHorarioPico,
        },
        respuesta: {
          categoria: item.categoria,
          probabilidad: item.probabilidad,
          costo_estimado_mensual: item.costo_estimado_mensual,
          recomendaciones: [],
        },
      }));
      setHistorial((prev) => (append ? [...prev, ...nuevos] : nuevos));
      setTieneMas(!data.last);
      setPagina(page);
    } catch (err) {
      setError("No se pudo cargar el historial desde el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial(0, false);
  }, [usuario]);

  const limpiarHistorial = () => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas borrar tu historial de análisis?",
      )
    ) {
      setHistorial([]);
      // Note: Backend doesn't have delete endpoint yet
    }
  };

  const cargarMas = () => {
    if (!cargando && tieneMas) {
      cargarHistorial(pagina + 1, true);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Encabezado */}
      <div style={estilos.tarjeta}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <History color="#0284c7" size={24} />
            <div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px" }}>
                Historial de Consultas
              </h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Registros guardados para la sesión:{" "}
                <b style={{ color: "#0284c7" }}>{usuarioActual}</b>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {historial.length > 0 && (
              <button onClick={limpiarHistorial} style={estilos.botonBorrar}>
                <Trash2 size={16} /> Limpiar Historial
              </button>
            )}
            <button
              onClick={() => cargarHistorial(0, false)}
              disabled={cargando}
              style={{
                ...estilos.botonBorrar,
                backgroundColor: "#e0e7ff",
                color: "#3730a3",
              }}
            >
              <RefreshCw size={16} /> Actualizar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={estilos.badgeError}>
          <span>{error}</span>
        </div>
      )}

      {/* Si no hay registros */}
      {historial.length === 0 && !cargando ? (
        <div style={estilos.tarjetaVacia}>
          <Zap size={40} color="#cbd5e1" />
          <h3 style={{ color: "#475569", margin: "10px 0 5px 0" }}>
            No hay análisis guardados
          </h3>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
            Realiza tu primer cálculo en el apartado de <b>Análisis General</b>{" "}
            para que aparezca aquí.
          </p>
        </div>
      ) : (
        /* Lista de análisis pasados */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {historial.map((item) => (
            <div key={item.id} style={estilos.itemTarjeta}>
              {/* Encabezado del ítem */}
              <div style={estilos.itemHeader}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  <Calendar size={14} />
                  <span>{item.fecha}</span>
                </div>
                <span style={estilos.badgeCategoria}>
                  {item.respuesta?.categoria || "Sin datos"}
                </span>
              </div>

              {/* Cuerpo: Parámetros vs Resultados */}
              <div style={estilos.gridDetalle}>
                {/* Lo que envió el usuario */}
                <div style={estilos.columnaInfo}>
                  <small style={estilos.subtitulo}>
                    Parámetros Ingresados:
                  </small>
                  <p style={estilos.dato}>
                    ⚡ Consumo: <b>{item.solicitud?.consumo_kwh} kWh</b>
                  </p>
                  <p style={estilos.dato}>
                    🏠 Inmueble: <b>{item.solicitud?.tipo_inmueble}</b>
                  </p>
                  <p style={estilos.dato}>
                    🔌 Equipos: <b>{item.solicitud?.cantidad_equipos}</b>
                  </p>
                </div>

                {/* Lo que devolvió Spring Boot */}
                <div style={estilos.columnaInfo}>
                  <small style={estilos.subtitulo}>Resultado Estimado:</small>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "2px",
                      marginTop: "4px",
                    }}
                  >
                    <DollarSign size={20} color="#16a34a" />
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: "bold",
                        color: "#0f172a",
                      }}
                    >
                      {item.respuesta?.costo_estimado_mensual}
                    </span>
                  </div>
                  <small style={{ color: "#64748b", fontSize: "12px" }}>
                    Probabilidad:{" "}
                    {((item.respuesta?.probabilidad || 0) * 100).toFixed(0)}%
                  </small>
                </div>
              </div>
            </div>
          ))}

          {tieneMas && (
            <button
              onClick={cargarMas}
              disabled={cargando}
              style={{
                ...estilos.botonBorrar,
                backgroundColor: "#f1f5f9",
                color: "#0284c7",
                width: "100%",
                justifyContent: "center",
              }}
            >
              {cargando ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const estilos = {
  tarjeta: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  tarjetaVacia: {
    backgroundColor: "#ffffff",
    padding: "48px 24px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  botonBorrar: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  itemTarjeta: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    borderLeft: "4px solid #0284c7",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    paddingBottom: "10px",
    borderBottom: "1px solid #f1f5f9",
  },
  badgeCategoria: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  gridDetalle: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  columnaInfo: { display: "flex", flexDirection: "column", gap: "4px" },
  subtitulo: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  dato: { margin: 0, fontSize: "13px", color: "#334155" },
  badgeError: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: "12px",
    borderRadius: "8px",
  },
};

export default HistorialView;
