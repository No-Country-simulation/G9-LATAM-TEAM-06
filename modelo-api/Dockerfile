# Builder stage: instala dependencias en un virtualenv
FROM python:3.12-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Runtime stage (minimal, non-root user)
FROM python:3.12-slim

# Crear usuario no root por seguridad
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

# Copiar solo el virtualenv con las dependencias desde el builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY app ./app
COPY models ./models

# Permisos para el usuario no root
RUN chown -R appuser:appuser /app

EXPOSE 8000

USER appuser

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]