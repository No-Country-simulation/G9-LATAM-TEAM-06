## Energ*IA*  
#### *Inteligencia para el consumo energético*
---
[![Status](https://img.shields.io/badge/status-en%20desarrollo-yellow)]()
[![Phyton](https://img.shields.io/badge/Python-3.1-blue?logo=python)]()
[![Backend](https://img.shields.io/badge/Java-25-orange?logo=openjdk)]()
[![Spring](https://img.shields.io/badge/Spring-4.1.0-6DB33F?logo=spring)]()
[![Docker](https://img.shields.io/badge/Docker%20Compose-5.3.1-blue?logo=docker)]()
[![Cloud](https://img.shields.io/badge/Oracle%20Cloud%20Services-pendiente-FF0000)]()
[![License](https://img.shields.io/badge/Licencia-TBD-blue)]()
[![Hackathon](https://img.shields.io/badge/hackathon-NoCountry%20|%20Alura_LATAM-purple)]() 
[![Version](https://img.shields.io/badge/Version-0.1-red)]()
---
## ¿Qué es Energ*IA*?

Es una solución inteligente que analiza los patrones de consumo de energía eléctrica de viviendas y pequeños establecimientos, los clasifica según su perfil de eficiencia y genera recomendaciones accionables junto con una estimación financiera del impacto para apoyar decisiones más conscientes y sostenibles.

El proyecto combina un pipeline de **Data Science** con una **API REST** construida en *Java 25*, *Spring 4.1.0*, y se desplegará sobre servicios de **Oracle Cloud Infrastructure (OCI)**. Se ofrece como una aplicación contenerizada utilizaqndo la tecnología de **Docker Compose**


## Tabla de contenidos

1. [Contexto y problemática](#-contexto-y-problematica)
2. [Acerca del proyecto](#acerca-del-proyecto)

## Contexto y problemática

Los usuarios residenciales y los pequeños establecimientos reciben mensualmente facturas de energía eléctrica cuyo detalle es opaco: el monto final se conoce, pero no los hábitos o equipos que más contribuyen al consumo. Esta falta de visibilidad impide actuar con criterio sobre el gasto y dificulta la adopción de comportamientos más eficientes.

Nuestra solución responderá a los siguientes requisitos del cliente a través de un MVP:

EnergiAI responde a cinco necesidades concretas del cliente, cada una asociada a una capacidad funcional del MVP:

| - | Necesidad del cliente | Capacidad del MVP |
|---|----------------------|-------------------|
| 1 | Comprender el perfil de consumo energético | Introducción de variables (kWh, uso de horario pico, cantidad de equipos, tipo de usuario) y categorización del perfil. |
| 2 | Evaluar que equipos son de alto consumo | *pendiente* |
| 3 | Recibir recomendaciones de mejora | Generación de recomendaciones accionables basadas en reglas o en el modelo. |
| 4 | Estimar costos asociados al consumo | Cálculo del impacto financiero usando una tarifa de referencia estandarizada. |
| 5 | Seguir indicadores de eficiencia en el tiempo | Persistencia de resultados en JSON para su uso. |

## Acerca del proyecto

Este proyecto se desarrolla durante un hackaton organizado en conjunto por Oracle Next Education + Alura LATAM + NoCountry con el fin de entregar un MVP. Los diferentes integrantes de un equipo comparten conocimientos de **Data Science** y **Desarollo Backend**; además los integrantes aportan conocimientos en otras áreas complementarias como desarrollo *mobile*, desarrollo *fullstack*, administración de bases de datos e ingeniería de software. 

