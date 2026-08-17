# Builder stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# sin auditoría/fund para reducir tiempos de instalación
RUN npm ci --no-audit --no-fund --loglevel=error

COPY . .

# Inyectar la API Key en el environment de producción durante el build (ARG → env var)
ARG API_KEY_SECRET=""
RUN if [ -n "$API_KEY_SECRET" ]; then \
    sed -i "s|apiKey: ''|apiKey: '${API_KEY_SECRET}'|" src/environments/environment.prod.ts; \
  fi

RUN npm run build

# Runtime stage
FROM nginx:1.27.3-alpine
COPY --from=builder /app/dist/energiai-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]