# Despliegue en OCI (EnergiAI)

Guía paso a paso para levantar EnergiAI en una VM de Oracle Cloud Infrastructure (OCI) con Docker Compose en modo producción.

## Que se despliega

| Servicio | Imagen/Fuente | Puerto publicado |
|----------|---------------|------------------|
| Frontend (Angular 21) | `energiai-frontend/` (build → nginx) | 80 |
| API (Spring Boot / Java 21) | `energiai-api/` | 8080 |
| Modelo IA (FastAPI) | `modelo-api/` | 8000 |
| Base de datos (MySQL 9.7) | `mysql:9.7` | interno |

> Nota de seguridad: el puerto 8000 (modelo-api) no se publica en `compose.prod.yml`; solo es consumido internamente por `energiai-api` a través de la red de contenedores.

## Prerrequisitos en la VM

- Docker Engine + plugin Docker Compose v2
- DNS / dominio apuntando a la IP publica de la VM (si vas a usar HTTPS)
- Security List / NSG de OCI con entrada a los puertos publicos: **80** (y 443 si agregas TLS)
- Git y acceso al repositorio

## Paso 1: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd G9-LATAM-TEAM-06
```

## Paso 2: Crear el archivo `.env`

```bash
cp .env.ejemplo .env
vi .env
```

Las unicas variables que Compose interpola de este archivo (el resto ya estan fijas en los `compose*.yml`):

| Variable | Uso | En produccion |
|----------|-----|---------------|
| `DB_USERNAME` | Usuario MySQL de la app | `energiai_app` (o el que quieras) |
| `DB_ROOT_PASSWORD` | Password root de MySQL | Genera una segura |
| `API_KEY_SECRET` | Key inyectada al frontend en `compose.yml` (dev) | No usado en prod |
| `API_KEY_SECRET_PROD` | Key inyectada al frontend en `compose.prod.yml` | **Debe coincidir con `secrets/api_key_secret_prod.txt`** |
| `CORS_ALLOWED_ORIGINS` | Origenes permitidos (coma-separado) | `https://app.tudominio.com,https://www.tudominio.com` |

## Paso 3: Crear los secrets

Docker Secrets monta estos archivos en `/run/secrets/` dentro de los contenedores. No se commitean.

```bash
mkdir -p secrets
printf 'TU_API_KEY_PROD' > secrets/api_key_secret_prod.txt
printf 'TU_PASSWORD_BD'  > secrets/db_password_prod.txt
```

- `api_key_secret_prod.txt` → lo lee el backend (`ApiKeyAuthenticationFilter`) y valida el header `X-API-KEY`.
- `db_password_prod.txt` → lo lee MySQL (`MYSQL_PASSWORD_FILE`) y Spring (`EnergiaiApiApplication`) para conectar a la BD.

> Si el backend responde `401 API Key invalido`, el valor de `.env` (`API_KEY_SECRET_PROD`) y el archivo `secrets/api_key_secret_prod.txt` no coinciden.

## Paso 4: Verificar el compose

```bash
docker compose -f compose.prod.yml config
```

Esto valida la interpolacion sin levantar nada. Si `CORS_ALLOWED_ORIGINS` o los secrets estan mal, falla aqui.

## Paso 5: Levantar

```bash
docker compose -f compose.prod.yml up --build -d
```

Seguimiento de logs:

```bash
docker compose -f compose.prod.yml logs -f energiai-api
```

## Paso 6: Verificar

```bash
# Health API
curl -s http://localhost:8080/actuator/health

# Health modelo (interno; se verifica vía el contenedor)
docker compose -f compose.prod.yml exec modelo-api python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"

# Frontend
curl -s -o /dev/null -w "%{http_code}\n" http://localhost/
```

Prueba funcional con API Key:

```bash
curl -s http://localhost:8080/analisis-energetico \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: TU_API_KEY_PROD" \
  -d '{"consumo_kwh":300,"uso_horario_pico":true,"cantidad_equipos":5,"tipo_inmueble":"casa","horas_alto_consumo":4}'
```

Desde el navegador: `http://<IP_publica>/`. El frontend llama al backend por el mismo origen (nginx proxya `/analisis-energetico`), asi que no requiere `apiUrl`.

## Actualizaciones y rollback

```bash
git pull
docker compose -f compose.prod.yml up --build -d
```

El volumen `mysql_data` persiste la BD entre redespliegues.

## HTTPS en OCI

`compose.prod.yml` expone HTTP (puerto 80). Opciones para HTTPS:

1. **Cloudflare Tunnel** (sin certificado propio): el compose dev ya trae el servicio `cloudflared` comentado como referencia — descomentar y configurar `secrets/tunnel_token.txt`.
2. **OCI Load Balancer** frente a la VM con certificado SSL.
3. **Reverse proxy nginx/caddy** en el host con Let's Encrypt.

Cualquiera de estas debe agregar el dominio HTTPS resultante a `CORS_ALLOWED_ORIGINS` en `.env`.

## Seguridad

- `.env` y `secrets/` no se versionan (ver `.gitignore`).
- El backend lee los secretos desde archivos montados (nunca en variables planas).
- No cambiar `SPRING_PROFILES_ACTIVE` a otra cosa que `prod`.
- En producción `modelo-api.fallback-enabled=false`: si el modelo no responde, la API responde `503 MODELO_API_NO_DISPONIBLE` en lugar de aplicar reglas de respaldo silenciosas. Si se desea tolerancia a fallos, cambiar a `true` en `compose.prod.yml` (env `MODELO_API_FALLBACK_ENABLED=true`).
- Para gestionar secretos de forma centralizada a futuro, migrar a **OCI Vault** (`api.key.secret.file` y `DB_PASSWORD_FILE` ya soportan rutas alternativas).
- Con OCI, no usar la password root en la healthcheck de produccion si no es necesaria.