import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import InicioView from "./components/InicioView";
import AnalisisGeneralView from "./components/AnalisisGeneralView";
import HistorialView from "./components/HistorialView";

function App() {
  // Estado inicial en 'inicio'
  const [vistaActual, setVistaActual] = useState("inicio");
  const [colapsado, setColapsado] = useState(false);

  const [usuario, setUsuario] = useState(() => {
    return localStorage.getItem("energiai_usuario") || "";
  });

  useEffect(() => {
    localStorage.setItem("energiai_usuario", usuario);
  }, [usuario]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        width: "100vw",
      }}
    >
      {/* Sidebar Colapsable */}
      <Sidebar
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        colapsado={colapsado}
        setColapsado={setColapsado}
        usuario={usuario}
        setUsuario={setUsuario}
      />

      {/* Contenido Principal */}
      <main
        style={{
          flexGrow: 1,
          padding: "30px 40px",
          fontFamily: "sans-serif",
          overflowY: "auto",
        }}
      >
        <header
          style={{
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: "26px" }}>
              Plataforma Energi AI
            </h1>
            <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
              Sesión activa:{" "}
              <b style={{ color: "#0284c7" }}>{usuario || "Modo Invitado"}</b>
            </p>
          </div>
        </header>

        {/* VISTA 0: INICIO / BIENVENIDA */}
        {vistaActual === "inicio" && (
          <InicioView onIrAAnalisis={() => setVistaActual("general")} />
        )}

        {/* VISTA 1: ANÁLISIS GENERAL */}
        {vistaActual === "general" && <AnalisisGeneralView usuario={usuario} />}

        {/* VISTA 2: ANÁLISIS DETALLADO */}
        {vistaActual === "detallado" && (
          <div style={estilos.tarjeta}>
            <h2>🔍 Análisis Detallado</h2>
            <p style={{ color: "#64748b" }}>
              Aquí podrás desglosar el consumo por electrodomésticos
              individuales y hábitos de uso.
            </p>
          </div>
        )}

        {/* VISTA 3: HISTORIAL */}
        {vistaActual === "historial" && <HistorialView usuario={usuario} />}
      </main>
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
};

export default App;
