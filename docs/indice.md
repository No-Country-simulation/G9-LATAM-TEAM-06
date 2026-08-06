# G9-LATAM-TEAM-06 — Documentación Completa del Proyecto

> Vault de Obsidian para documentar cada componente, decisión y flujo del sistema EnergIA.

---

## 📁 Estructura del Monorepo

```
G9-LATAM-TEAM-06/
├── compose.yml                 # Orquestación Docker (frontend + api + db)
├── energiai-frontend/          # React + Vite (UI)
├── energiai-api/               # Spring Boot 4 (Backend principal)
├── energiai-fastapi/           # FastAPI (Microservicio ML/Data Science)
└── docs/                       # ← ESTA VAULT (Obsidian)
```

---

## 🔗 Navegación Rápida

### Arquitectura General
- [[arquitectura-general]]
- [[flujo-de-datos]]
- [[decisiones-tecnicas]]

### Frontend (React)
- [[frontend-estructura]]
- [[frontend-componentes]]
- [[frontend-servicios-api]]
- [[frontend-estados-y-formularios]]

### Backend Spring Boot (energiai-api)
- [[spring-estructura]]
- [[spring-controladores]]
- [[spring-servicios]]
- [[spring-dtos-y-modelos]]
- [[spring-repositorios]]
- [[spring-seguridad-y-config]]

### Microservicio FastAPI (energiai-fastapi)
- [[fastapi-estructura]]
- [[fastapi-endpoints]]
- [[fastapi-modelos-ml]]
- [[fastapi-integracion-spring]]

### Base de Datos & Migraciones
- [[bd-esquema]]
- [[bd-migraciones-flyway]]

### Despliegue & DevOps
- [[docker-compose]]
- [[variables-entorno]]
- [[ci-cd]]

### Historial & Reuniones
- [[reuniones/index]]
- [[changelog]]