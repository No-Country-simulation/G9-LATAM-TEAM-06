# Energi IA

> **Convierte tus datos de consumo en decisiones más inteligentes.**

[![Status](https://img.shields.io/badge/Status-Completado-brightgreen.svg)]()
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-21.2.0-red.svg)](https://angular.dev/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📌 Descripción

**Energi IA** es una solución inteligente diseñada para optimizar el consumo eléctrico. Permite a los usuarios y organizaciones dar seguimiento a su evolución energética, identificar patrones de alto consumo y recibir recomendaciones de acción concretas para mejorar su eficiencia energética.

- 📈 **Seguimiento continuo:** Visualiza la evolución de tu consumo a lo largo del tiempo.
- 🔍 **Detección de patrones:** Identifica picos inusuales y hábitos de alto consumo.
- 💡 **Recomendaciones inteligentes:** Obtén acciones claras y personalizadas para reducir costos e impacto ambiental.

### ☁️ Despliegue
El proyecto se encuentra alojado y desplegado en **Oracle Cloud Infrastructure (OCI)** sobre una instancia **Ampere A1 (ARM64)** ejecutando **Ubuntu 24.04 LTS**.

---

## 🎬 Demo del proyecto

### Video de demostración:

[![Demostración de Energi IA](https://img.youtube.com/vi/f7DShxUZmTI/maxresdefault.jpg)](https://www.youtube.com/watch?v=f7DShxUZmTI)

> 🎥 **[Haz clic aquí para ver la demostración en YouTube](https://www.youtube.com/watch?v=f7DShxUZmTI)**

---

## ⚡ Funcionalidades del Sistema

El sistema cuenta con un conjunto de herramientas diseñadas para el análisis, diagnóstico y optimización del uso energético:

- 📋 **Resumen:** 
- 📊 **Análisis General** 
- 📜 **Historial** 
- ⚖️ **Comparar Periodos** 
- 📂 **Procesamiento CSV** 
- 🏆 **Ranking Energético** 
- 💡 **Simulador de Ahorro**

---

## 🏗️ Arquitectura del Sistema

El sistema sigue una arquitectura modular y desacoplada, contenedorizada mediante **Docker** para facilitar su despliegue en entornos ARM64 / Cloud:

                  +-----------------------------+
                  |     Cliente Web / Usuario   |
                  +--------------+--------------+
                                 |
                                 v
                  +-----------------------------+
                  |     Frontend (Angular 21)   |
                  |   Interfaz & Visualización  |
                  +--------------+--------------+
                                 |
                                 v HTTP / REST API
                  +-----------------------------+
                  |   Backend (Spring Boot 4.1) |
                  |   Lógica & Gestión de Datos |
                  +--------------+--------------+
                                 |
                                 v
                  +-----------------------------+
                  |   Servicio IA / Analytics   |
                  |  (Python / Scikit-Learn/    |
                  |          Pandas)            |
                  +-----------------------------+

### Flujo de Datos y Componentes:

1. **Frontend (Angular 21.2.0):** Proporciona la interfaz interactiva para la carga de datos (CSV), visualización de métricas, comparativas y simulación de ahorros.
2. **Backend REST API (Spring Boot 4.1.0 / Java 21):** Orquesta las peticiones, procesa las reglas de negocio, valida los archivos ingresados y gestiona el flujo de información.
3. **Módulo de Analítica e IA (Python 3.10+):** Ejecuta la lógica de Machine Learning y procesamiento de datos para clasificar niveles de eficiencia, detectar patrones de alto consumo y generar proyecciones de ahorro.
4. **Infraestructura & Contenedores (Docker / OCI):** Todo el entorno se ejecuta de forma aislada mediante Docker sobre **Oracle Cloud Infrastructure (OCI)** en una arquitectura Ampere A1 (ARM64) con **Ubuntu 24.04 LTS**.

---

---

## 🛠️ Tecnologías Utilizadas / Stack Técnico

| Capa / Componente | Tecnología | Descripción / Uso |
| :--- | :--- | :--- |
| **Frontend** | Angular 21.2.0 | Framework SPA para la interfaz interactiva, componentes gráficos y dashboards. |
| **Backend** | Java 21 / Spring Boot 4.1.0 | API RESTful, gestión de servicios, lógica de negocio y validaciones. |
| **Analítica & ML** | Python 3.10+ | Modelos de Machine Learning (Scikit-Learn) y procesamiento de datasets (Pandas, NumPy). |
| **Contenedores** | Docker & Docker Compose | Contenedorización, aislamiento de entorno y orquestación de servicios. |
| **Infraestructura** | OCI Ampere A1 (ARM64) | Instancia en la nube basada en Ubuntu 24.04 LTS para hosting de producción. |

---

---

## 🚀 Prerrequisitos e Instalación / Despliegue con Docker

### Prerrequisitos
Asegúrate de contar con las siguientes herramientas instaladas antes de comenzar:
* **Git**
* **Docker Engine** (versión 20.10 o superior)
* **Docker Compose** (versión 2.0 o superior)

---

### Paso a Paso para Ejecución Local o en Servidor

### Con Docker (recomendado)

```bash
# Desde la raíz del proyecto
docker compose up -d
```

Esto levanta:
- **Frontend** en `http://localhost`
- **Modelo‑API** en `http://localhost:8000` (endpoint `/predict`)
- **Backend** en `http://localhost:8090` (health: `/actuator/health`)
- **MySQL** interna (puerto 3307 en el host)

### Sin Docker (desarrollo)

**Backend**
```bash
cd energiai-api
./mvnw spring-boot:run   # usa Spring Boot, puertos por defecto
```

**Frontend**
```bash
cd energiai-frontend
npm install
npm start   #servir en http://localhost:4200 (cambiar en angular.json si es necesario)
```

**Modelo‑API**
```bash
cd modelo-api
pip install -r requirements.txt
uvicorn app.main:app --reload   # escucha en http://localhost:8000
# Salud: http://localhost:8000/health
```

---

## Endpoints principales

| Método | URL | Descripción |
|--------|-----|-------------|
| `POST` | `/analisis-energetico` | Recibe datos de consumo (consumo_kwh, uso_horario_pico, cantidad_equipos, tipo_inmueble, horas_alto_consumo) y devuelve **categoría**, **probabilidad** y **recomendaciones**. Este es el endpoint obligatorio del entregable. |
| `GET` | `/energiai-api/actuator/health` | Salud del backend Spring |
| `GET` | `/modelo-api/health` | Salud del modelo FastAPI |
| `GET` | `/swagger-ui.html` | Documentación interactiva de la API (SpringDoc). Ver nota a continuación. |

### Flujo de petición

1. **Frontend** envía un `POST` a `/analisis-energetico` con los 5 campos obligatorios.
2. **Backend** (Spring Boot) recibe la petición, valida los datos y llama **internamente** al modelo‑API (`POST /modelo-api/predict`).
3. El modelo devuelve la categoría, probabilidad y recomendaciones.
4. El backend devuelve al frontend un JSON con `categoria`, `probabilidad`, `nivel_analisis` y `recomendaciones`.

### Ejemplo de petición al entregable

```json
POST /analisis-energetico
{
  "consumo_kwh": 500,
  "uso_horario_pico": true,
  "cantidad_equipos": 8,
  "tipo_inmueble": "Casa",
  "horas_alto_consumo": 6
}
```

### Respuesta típica

```json
{
  "categoria": "Eficiente",
  "probabilidad": 0.91,
  "nivel_analisis": "basico",
  "campos_imputados": [],
  "recomendaciones": [
    "Mantener los buenos hábitos de consumo actuales y monitorear periódicamente",
    "Evaluar la distribución de equipos de consumo medio"
  ],
  "origen_prediccion": "modelo_ml",
  "modelo_version": "3.0.0"
}
```

## Cómo correrlo

### Con Docker (recomendado)

```bash
docker compose up -d
```

### Sin Docker (desarrollo)

- **Backend**: `cd energiai-api && ./mvnw spring-boot:run`
- **Frontend**: `cd energiai-frontend && npm start`
- **Modelo‑API**: `cd modelo-api && uvicorn app.main:app --reload`

---

## Recursos opcionales (según PDF)

- Dashboard de seguimiento (implementado en el panel de inicio).
- Historial de análisis (componente `historial`).
- Procesamiento en lote mediante CSV (lógica lista, UI pendiente).
- Contenedorización con Docker (el `compose.yml` ya lo incluye).
- Pruebas automatizadas (tests unitarios 84/84 backend + 84/84 frontend).
- Visualizaciones gráficas (límites del MVP, pero se pueden agregar).
- Comparación entre períodos (componente `comparacion-periodos`).
- Ranking de eficiencia energética (puede agregarse como vista extra).
- Simulación de escenarios de ahorro (el simulador ya lo incluye).

---

*Proyecto Hackathon ONE– Equipo G9 LATAM – 2026*

