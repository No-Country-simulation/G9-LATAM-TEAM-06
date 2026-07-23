import React, { useState } from "react";
import { obtenerAnalisisEnergetico } from "../services/api";
import { Send, CheckCircle2, AlertCircle, Zap } from "lucide-react";

function FormularioView({ onAnalisisCompletado }) {
  // Estado local para los campos del formulario
  const [formData, setFormData] = useState({
    consumo_kwh: 250,
    tipo_inmueble: "Residencial",
    cantidad_equipos: 5,
    horas_alto_consumo: 6,
    uso_horario_pico: true,
  });

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Manejar cambios en inputs numéricos y texto
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  // Enviar el formulario a Spring Boot
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const resultado = await obtenerAnalisisEnergetico(formData);

      // Guardar opcionalmente en sessionStorage para persistencia de sesión
      sessionStorage.setItem("ultimo_analisis", JSON.stringify(resultado));

      setMensaje({
        tipo: "exito",
        texto: "¡Análisis calculado correctamente!",
      });

      // Notificar a App.jsx para actualizar el estado global o redirigir
      if (onAnalisisCompletado) {
        onAnalisisCompletado(resultado);
      }
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: "Error al enviar datos a la API de Spring Boot",
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.tarjeta}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <Zap color="#0284c7" size={28} />
        <div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>
            Calculadora de Análisis Energético
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Ingresa los parámetros de tu consumo para obtener un diagnóstico con
            IA.
          </p>
        </div>
      </div>

      {mensaje && (
        <div
          style={
            mensaje.tipo === "exito" ? estilos.badgeExito : estilos.badgeError
          }
        >
          {mensaje.tipo === "exito" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={estilos.formulario}>
        <div style={estilos.gridInputs}>
          {/* Consumo kWh */}
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

          {/* Tipo de Inmueble */}
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

          {/* Cantidad de Equipos */}
          <div style={estilos.grupoInput}>
            <label style={estilos.label}>
              Cantidad de Equipos / Electrodomésticos:
            </label>
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

          {/* Horas de Alto Consumo */}
          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Horas de Alto Consumo al día:</label>
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

        {/* Checkbox Horario Pico */}
        <div
          style={{
            marginTop: "15px",
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
            style={{ color: "#334155", cursor: "pointer", fontSize: "15px" }}
          >
            ¿Sueles utilizar equipos de alto consumo en <b>Horario Pico</b>?
          </label>
        </div>

        {/* Botón de Enviar */}
        <button type="submit" disabled={cargando} style={estilos.botonSubmit}>
          <Send size={18} />
          {cargando ? "Procesando en Spring Boot..." : "Calcular Análisis"}
        </button>
      </form>
    </div>
  );
}

const estilos = {
  tarjeta: {
    backgroundColor: "#ffffff",
    padding: "28px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  formulario: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: "20px",
  },
  gridInputs: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  grupoInput: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
  },
  botonSubmit: {
    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  badgeExito: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#15803d",
    backgroundColor: "#dcfce7",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
  },
  badgeError: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
  },
};

export default FormularioView;
