import React, { useState, useEffect } from "react";
import { obtenerAnalisisEnergetico } from "../services/api";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Lightbulb,
  Activity,
} from "lucide-react";

function DashboardView({ datosExternos }) {
  const [datos, setDatos] = useState(datosExternos || null);
  const [cargando, setCargando] = useState(!datosExternos);
  const [error, setError] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await obtenerAnalisisEnergetico();
      setDatos(respuesta);
    } catch (err) {
      setError("No se pudo conectar con la API de Energiai");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!datosExternos) {
      cargarDatos();
    }
  }, [datosExternos]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Encabezado de Estado */}
      <div style={estilos.tarjeta}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity color="#0284c7" size={24} />
            <h3 style={{ margin: 0, color: "#0f172a" }}>
              Estado de la Conexión
            </h3>
          </div>
          <button onClick={cargarDatos} style={estilos.botonRecargar}>
            <RefreshCw size={16} /> Recargar Análisis
          </button>
        </div>

        <div style={{ marginTop: "15px" }}>
          {cargando && (
            <p style={{ color: "#0284c7" }}>
              ⏳ Procesando análisis en tiempo real...
            </p>
          )}

          {error && (
            <div style={estilos.badgeError}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!cargando && !error && (
            <div style={estilos.badgeExito}>
              <CheckCircle2 size={18} />
              <span>¡Conexión activa con Spring Boot!</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas Principales de Métricas */}
      {datos && (
        <>
          <div style={estilos.gridMetricas}>
            {/* Tarjeta 1: Categoría */}
            <div style={estilos.tarjetaMetrica}>
              <span style={estilos.tituloMetrica}>Categoría de Consumo</span>
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={estilos.badgeCategoria}>{datos.categoria}</span>
              </div>
              <small
                style={{ color: "#64748b", marginTop: "8px", display: "block" }}
              >
                Probabilidad calculada: {(datos.probabilidad * 100).toFixed(0)}%
              </small>
            </div>

            {/* Tarjeta 2: Costo Estimado */}
            <div style={estilos.tarjetaMetrica}>
              <span style={estilos.tituloMetrica}>Costo Estimado Mensual</span>
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px",
                }}
              >
                <DollarSign size={28} color="#16a34a" />
                <span style={estilos.valorMetrica}>
                  {datos.costo_estimado_mensual}
                </span>
              </div>
              <small
                style={{ color: "#64748b", marginTop: "8px", display: "block" }}
              >
                Basado en tarifa activa
              </small>
            </div>
          </div>

          {/* Tarjeta 3: Recomendaciones del Sistema */}
          <div style={estilos.tarjeta}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <Lightbulb color="#eab308" size={24} />
              <h3 style={{ margin: 0, color: "#0f172a" }}>
                Recomendaciones Personalizadas
              </h3>
            </div>

            <ul style={estilos.listaRecomendaciones}>
              {datos.recomendaciones?.map((rec, index) => (
                <li key={index} style={estilos.itemRecomendacion}>
                  <span style={estilos.bullet}>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
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
  gridMetricas: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  tarjetaMetrica: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderLeft: "4px solid #0284c7",
  },
  tituloMetrica: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  valorMetrica: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#0f172a",
  },
  badgeCategoria: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
    padding: "6px 16px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "18px",
  },
  botonRecargar: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  badgeExito: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#15803d",
    backgroundColor: "#dcfce7",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "500",
  },
  badgeError: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: "10px 14px",
    borderRadius: "8px",
    fontWeight: "500",
  },
  listaRecomendaciones: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  itemRecomendacion: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    backgroundColor: "#f8fafc",
    padding: "12px 16px",
    borderRadius: "8px",
    color: "#334155",
    fontSize: "15px",
  },
  bullet: {
    color: "#eab308",
    fontWeight: "bold",
    fontSize: "20px",
    lineHeight: "1",
  },
};

export default DashboardView;
