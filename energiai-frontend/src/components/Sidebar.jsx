import React from "react";
import {
  Home,
  BarChart2,
  Search,
  History,
  ChevronLeft,
  ChevronRight,
  Zap,
  UserCheck,
} from "lucide-react";

function Sidebar({
  vistaActual,
  setVistaActual,
  colapsado,
  setColapsado,
  usuario,
  setUsuario,
}) {
  const menuItems = [
    { id: "inicio", label: "Inicio", icon: <Home size={20} /> },
    { id: "general", label: "Análisis General", icon: <BarChart2 size={20} /> },
    {
      id: "detallado",
      label: "Análisis Detallado",
      icon: <Search size={20} />,
    },
    { id: "historial", label: "Historial", icon: <History size={20} /> },
  ];

  return (
    <aside
      style={{
        width: colapsado ? "80px" : "260px",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        padding: "20px 15px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "width 0.3s ease",
        boxSizing: "border-box",
      }}
    >
      {/* Superior: Logo y Toggle */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: colapsado ? "center" : "space-between",
            marginBottom: "30px",
          }}
        >
          {!colapsado && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Zap color="#38bdf8" size={24} />
              <h2 style={{ margin: 0, fontSize: "20px", color: "#f8fafc" }}>
                Energi AI
              </h2>
            </div>
          )}
          {colapsado && <Zap color="#38bdf8" size={28} />}

          <button
            onClick={() => setColapsado(!colapsado)}
            style={{
              backgroundColor: "#1e293b",
              border: "none",
              color: "#94a3b8",
              padding: "6px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            {colapsado ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Opciones de Menú */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {menuItems.map((item) => {
            const activo = vistaActual === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setVistaActual(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  justifyContent: colapsado ? "center" : "flex-start",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activo ? "#0284c7" : "transparent",
                  color: activo ? "#ffffff" : "#94a3b8",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: activo ? "600" : "normal",
                  transition: "background-color 0.2s",
                  width: "100%",
                }}
                title={colapsado ? item.label : ""}
              >
                {item.icon}
                {!colapsado && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Inferior: Identificador/Sesión Ficticia */}
      <div
        style={{
          borderTop: "1px solid #1e293b",
          paddingTop: "15px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {!colapsado ? (
          <div>
            <label
              style={{
                fontSize: "12px",
                color: "#64748b",
                display: "block",
                marginBottom: "6px",
              }}
            >
              SESIÓN DE USUARIO
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #334155",
                backgroundColor: "#1e293b",
                color: "#f8fafc",
                fontSize: "13px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        ) : (
          <div
            style={{ display: "flex", justifyContent: "center" }}
            title={usuario || "Invitado"}
          >
            <UserCheck color={usuario ? "#22c55e" : "#64748b"} size={20} />
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
