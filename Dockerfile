# syntax=docker/dockerfile:1

# El SPA y el API viajan en la misma imagen a propósito: el frontend pide '/api/...'
# con rutas relativas y abre socket.io sobre el origen actual, así que servirlos desde
# dos dominios distintos obligaría a parametrizar cada servicio del cliente.

# ---------- Compila el SPA de Angular ----------
FROM node:22.22.3-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Compila el API de NestJS ----------
FROM node:22.22.3-alpine AS backend
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ---------- Imagen final ----------
FROM node:22.22.3-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# El chequeo periódico se programa en hora de Colombia y el contenedor corre en UTC:
# sin la base de zonas horarias, el resumen de las 6 de la mañana saldría a la 1.
RUN apk add --no-cache tzdata
ENV TZ=America/Bogota

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=backend /build/backend/dist ./dist
COPY --from=frontend /build/frontend/dist/frontend/browser ./client

# Punto de montaje del volumen: las imágenes subidas no pueden vivir en el
# sistema de archivos efímero del contenedor.
RUN mkdir -p uploads

EXPOSE 3000

# Railway reinicia el contenedor si deja de responder; sin esto, un API caído con el
# proceso vivo pasaría inadvertido.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT??3000)+'/api/monitoring/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
