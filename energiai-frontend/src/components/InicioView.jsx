import React from "react";
import {
  Zap,
  BarChart2,
  ShieldCheck,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

function InicioView({ onIrAAnalisis }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* HERO / BIENVENIDA */}
      <div style={estilos.hero}>
        <div style={{ maxWidth: "650px" }}>
          <div style={estilos.badgeHero}>
            <Zap size={16} color="#38bdf8" />
            <span>Optimizador Energético con IA</span>
          </div>
          <h1 style={estilos.tituloHero}>
            Toma el control del consumo eléctrico en tu hogar o negocio
          </h1>
          <p style={estilos.subtituloHero}>
            <b>Energi AI</b> analiza tu historial y hábitos de uso de
            electrodomésticos para ofrecerte estimaciones de costo, niveles de
            eficiencia y recomendaciones inteligentes en tiempo real.
          </p>
          <button onClick={onIrAAnalisis} style={estilos.botonHero}>
            <span>Iniciar Análisis General</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* TARJETAS DE CARACTERÍSTICAS / CÓMO FUNCIONA */}
      <div>
        <h2
          style={{ color: "#0f172a", fontSize: "20px", marginBottom: "16px" }}
        >
          ¿Qué puedes hacer en Energi AI?
        </h2>

        <div style={estilos.gridCaracteristicas}>
          <div style={estilos.tarjetaCard}>
            <div style={estilos.iconoContenedor("#e0f2fe", "#0284c7")}>
              <BarChart2 size={24} />
            </div>
            <h3 style={estilos.tituloCard}>Análisis Instantáneo</h3>
            <p style={estilos.textoCard}>
              Ingresa tus kWh consumidos y la cantidad de equipos para obtener
              un diagnóstico rápido de tu nivel de gasto.
            </p>
          </div>

          <div style={estilos.tarjetaCard}>
            <div style={estilos.iconoContenedor("#fef3c7", "#d97706")}>
              <Lightbulb size={24} />
            </div>
            <h3 style={estilos.tituloCard}>Consejos Inteligentes</h3>
            <p style={estilos.textoCard}>
              Recibe sugerencias personalizadas para redistribuir horarios de
              uso y reducir significativamente tu factura.
            </p>
          </div>

          <div style={estilos.tarjetaCard}>
            <div style={estilos.iconoContenedor("#dcfce7", "#16a34a")}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={estilos.tituloCard}>Sin Contraseñas</h3>
            <p style={estilos.textoCard}>
              Identifícate únicamente con tu correo electrónico para vincular y
              consultar tu historial de simulaciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const estilos = {
  hero: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "48px 40px",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    backgroundImage:
      "radial-gradient(circle at top right, #1e293b 0%, #0f172a 60%)",
  },
  badgeHero: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    color: "#38bdf8",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
    border: "1px solid rgba(56, 189, 248, 0.2)",
  },
  tituloHero: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "0 0 16px 0",
    lineHeight: "1.2",
  },
  subtituloHero: {
    fontSize: "16px",
    color: "#94a3b8",
    lineHeight: "1.6",
    margin: "0 0 28px 0",
  },
  botonHero: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "14px 28px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s, background-color 0.2s",
  },
  gridCaracteristicas: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },
  tarjetaCard: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #f1f5f9",
  },
  iconoContenedor: (bg, color) => ({
    backgroundColor: bg,
    color: color,
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  }),
  tituloCard: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  textoCard: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.5",
    margin: 0,
  },
};

export default InicioView;
