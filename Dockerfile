# syntax=docker/dockerfile:1

# ---- Stage 1: frontend (Tailwind CSS, Alpine.js, three.js) -------------------
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tailwind.config.js ./
COPY frontend ./frontend
COPY templates ./templates
RUN npm run build

# ---- Stage 2: Django runtime --------------------------------------------------
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_DEBUG=0
WORKDIR /app

RUN groupadd --system --gid 10001 kb \
 && useradd --system --uid 10001 --gid kb --home-dir /app --shell /usr/sbin/nologin kb

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY --chown=10001:10001 . .
COPY --from=frontend --chown=10001:10001 /app/static ./static
RUN DJANGO_SECRET_KEY=collectstatic-only python manage.py collectstatic --noinput

USER 10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD ["python", "-c", "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2).status == 200 else 1)"]
CMD ["gunicorn", "kindbytes.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "30", "--access-logfile", "-"]
