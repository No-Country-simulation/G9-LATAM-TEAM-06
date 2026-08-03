import React, { useState } from "react";
import { crearAnalisisEnergetico } from "../services/api";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
  DollarSign,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

function AnalisisGeneralView({ usuario }) {
  const [formData, setFormData] = useState({
    consumo_kwh: 250,
    tipo_inmueble: "Residencial",
    cantidad_equipos: 5,
    horas_alto_consumo: 6,
    uso_horario_pico: true,
    dispositivos_alto: 0,
    dispositivos_medio: 0,
    dispositivos_bajo: 0,
  });

  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [validacionEquipos, setValidacionEquipos] = useState({ valido: true, mensaje: "" });

  const validarEquipos = (data) => {
    const suma = (data.dispositivos_alto || 0) + (data.dispositivos_medio || 0) + (data.dispositivos_bajo || 0);
    if (suma !== data.cantidad_equipos) {
      return { valido: false, mensaje: `La suma (${suma}) debe igualar la cantidad de equipos (${data.cantidad_equipos})` };
    }
    if (data.dispositivos_alto < 0 || data.dispositivos_medio < 0 || data.dispositivos_bajo < 0) {
      return { valido: false, mensaje: "Los valores no pueden ser negativos" };
    }
    return { valido: true, mensaje: "" };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : type === "number" ? Number(value) : value;
    const newData = { ...formData, [name]: newValue };
    setFormData(newData);
    const validacion = validarEquipos(newData);
    setValidacionEquipos(validacion);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validacion = validarEquipos(formData);
    if (!validacion.valido) {
      setValidacionEquipos(validacion);
      setError(validacion.mensaje);
      return;
    }
    setValidacionEquipos({ valido: true, mensaje: "" });
    setError(null);

    setCargando(true);
    setError(null);

    try {
      const data = await crearAnalisisEnergetico(formData, usuario);
      setResultado(data);

      // Guardar en el Historial del Navegador (asociado al correo si existe)
      const nuevoRegistro = {
        id: Date.now(),
        fecha: new Date().toLocaleString(),
        usuario: usuario || "Invitado",
        solicitud: formData,
        respuesta: data,
      };

      const historialPrevio = JSON.parse(
        localStorage.getItem("energiai_historial") || "[]",
      );
      localStorage.setItem(
        "energiai_historial",
        JSON.stringify([nuevoRegistro, ...historialPrevio]),
      );
    } catch (err) {
      setError(
        "Error al cargar, intente mas tarde o verifique su conexión a internet.",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* FORMULARIO DE CONSULTA */}
      <div style={estilos.tarjeta}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <Zap color="#0284c7" size={24} />
          <div>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px" }}>
              Parámetros del Análisis General
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Completa los datos para consultar la estimación energética.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={estilos.formulario}>
          <div style={estilos.gridInputs}>
            <div style={estilos.grupoInput}>
              <label style={estilos.label}>Consumo Mensual (kWh):</label>
              <input
                type="number"
                name="consumo_kwh"
                value={formData.consumo_kwh}
                onChange={handleChange}
                required
                min="1"
                style={estilos.input}
              />
            </div>

            <div style={estilos.grupoInput}>
              <label style={estilos.label}>Tipo de Inmueble:</label>
              <select
                name="tipo_inmueble"
                value={formData.tipo_inmueble}
                onChange={handleChange}
                style={estilos.input}
              >
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>

            <div style={estilos.grupoInput}>
              <label style={estilos.label}>Cantidad de Equipos:</label>
              <input
                type="number"
                name="cantidad_equipos"
                value={formData.cantidad_equipos}
                onChange={handleChange}
                required
                min="1"
                style={estilos.input}
              />
            </div>

            <div style={estilos.grupoInput}>
              <label style={estilos.label}>Horas Alto Consumo / día:</label>
              <input
                type="number"
                name="horas_alto_consumo"
                value={formData.horas_alto_consumo}
                onChange={handleChange}
                required
                min="0"
                max="24"
                style={estilos.input}
              />
            </div>
          </div>

          <div style={estilos.seccionEquipos}>
            <h3 style={estilos.subtituloSeccion}>Distribución de Equipos por Consumo</h3>
            <p style={estilos.ayudaTexto}>La suma debe igualar la cantidad de equipos ({formData.cantidad_equipos})</p>
            <div style={estilos.gridEquipos}>
<div style={estilos.grupoEquipo}>
                <label style={estilos.labelEquipo}>Dispositivos Alto Consumo</label>
                <input
                  type="number"
                  name="dispositivos_alto"
                  value={formData.dispositivos_alto}
                  onChange={handleChange}
                  min="0"
                  max={formData.cantidad_equipos}
                  style={estilos.inputEquipo}
                />
                <small style={estilos.ayudaEquipo}>Aire acondicionado, calefactor, secadora, etc.</small>
              </div>
              <div style={estilos.grupoEquipo}>
                <label style={estilos.labelEquipo}>Dispositivos Medio Consumo</label>
                <input
                  type="number"
                  name="dispositivos_medio"
                  value={formData.dispositivos_medio}
                  onChange={handleChange}
                  min="0"
                  max={formData.cantidad_equipos}
                  style={estilos.inputEquipo}
                />
                <small style={estilos.ayudaEquipo}>Lavadora, lavavajillas, plancha, microondas, etc.</small>
              </div>
              <div style={estilos.grupoEquipo}>
                <label style={estilos.labelEquipo}>Dispositivos Bajo Consumo</label>
                <input
                  type="number"
                  name="dispositivos_bajo"
                  value={formData.dispositivos_bajo}
                  onChange={handleChange}
                  min="0"
                  max={formData.cantidad_equipos}
                  style={estilos.inputEquipo}
                />
                <small style={estilos.ayudaEquipo}>Nevera, TV, PC, luces LED, router, cargadores, etc.</small>
              </div>
            </div>
            {(!validacionEquipos.valido) && (
              <div style={estilos.errorEquipos}>
                <AlertTriangle size={14} />
                <span>{validacionEquipos.mensaje}</span>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              type="checkbox"
              id="uso_horario_pico"
              name="uso_horario_pico"
              checked={formData.uso_horario_pico}
              onChange={handleChange}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label
              htmlFor="uso_horario_pico"
              style={{ color: "#334155", cursor: "pointer", fontSize: "14px" }}
            >
              ¿Uso frecuente en horario pico?
            </label>
          </div>

          <button type="submit" disabled={cargando || !validacionEquipos.valido} style={estilos.botonSubmit}>
            <Send size={16} />
            {cargando ? "Analizando en Spring Boot..." : "Generar Análisis"}
          </button>
        </form>
      </div>

      {/* MENSAJE DE ERROR */}
      {error && (
        <div style={estilos.badgeError}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* RESULTADO DESPLEGADO EN LA MISMA VISTA */}
      {resultado && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#15803d",
              fontWeight: "bold",
            }}
          >
            <CheckCircle2 size={20} />
            <span>Resultado Generado con Éxito</span>
          </div>

          <div style={estilos.gridMetricas}>
            <div style={estilos.tarjetaMetrica}>
              <span style={estilos.tituloMetrica}>Categoría de Consumo</span>
              <div style={{ marginTop: "10px" }}>
                <span style={estilos.badgeCategoria}>
                  {resultado.categoria}
                </span>
              </div>
              <small
                style={{
                  color: "#64748b",
                  marginTop: "10px",
                  display: "block",
                }}
              >
                Probabilidad: {(resultado.probabilidad * 100).toFixed(0)}%
              </small>
            </div>

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
                  {resultado.costoEstimado}
                </span>
              </div>
              <small
                style={{
                  color: "#64748b",
                  marginTop: "10px",
                  display: "block",
                }}
              >
                Estimación en divisa base
              </small>
            </div>
          </div>

          <div style={estilos.tarjeta}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <Lightbulb color="#eab308" size={22} />
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px" }}>
                Recomendaciones
              </h3>
            </div>
            <ul style={estilos.listaRecomendaciones}>
              {resultado.recomendaciones?.map((rec, index) => (
                <li key={index} style={estilos.itemRecomendacion}>
                  <span style={{ color: "#eab308", fontWeight: "bold" }}>
                    •
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
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
  formulario: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "15px",
  },
  gridInputs: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  grupoInput: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
  },
  botonSubmit: {
    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  badgeError: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: "12px",
    borderRadius: "8px",
  },
  seccionEquipos: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  subtituloSeccion: {
    margin: "0 0 8px 0",
    fontSize: "15px",
    fontWeight: 600,
    color: "#334155",
  },
  ayudaTexto: {
    margin: "0 0 12px 0",
    fontSize: "13px",
    color: "#64748b",
  },
  gridEquipos: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  grupoEquipo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  labelEquipo: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "4px",
  },
  inputEquipo: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  ayudaEquipo: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  errorEquipos: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "12px",
    padding: "8px 12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    color: "#991b1c",
    fontSize: "13px",
  },
  gridMetricas: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  tarjetaMetrica: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderLeft: "4px solid #0284c7",
  },
  tituloMetrica: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  valorMetrica: { fontSize: "28px", fontWeight: "bold", color: "#0f172a" },
  badgeCategoria: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
    padding: "4px 12px",
    borderRadius: "16px",
    fontWeight: "bold",
    fontSize: "16px",
  },
  listaRecomendaciones: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  itemRecomendacion: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    backgroundColor: "#f8fafc",
    padding: "10px 14px",
    borderRadius: "8px",
    color: "#334155",
    fontSize: "14px",
  },
};

export default AnalisisGeneralView;
