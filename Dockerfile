# ============================================================
# EMS Monorepo — Multi-App Dockerfile
# ============================================================
# Builds all frontend / server apps from the EMS monorepo.
# Usage (from workspace root):
#   docker compose build school-dashboard
#   docker compose build parent-app
#   docker compose build staff-app
#   docker compose build owlin-web
#   docker compose build owlin-server
#
# Targets:
#   school-dashboard  — Vite SPA served by nginx (:80)
#   parent-app        — Expo web export served by nginx (:80)
#   staff-app         — Expo web export served by nginx (:80)
#   owlin-web         — Vite SPA served by nginx (:80)
#   owlin-server      — Node/Express API (:4001)
# ============================================================

# ─── Base builder ───────────────────────────────────────────
FROM node:20-slim AS builder-base
WORKDIR /app

# Native build tools (some deps need node-gyp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy monorepo package manifests (cache layer)
COPY package.json package-lock.json ./
COPY shared-types/package.json ./shared-types/
COPY shared-config/package.json ./shared-config/
COPY shared-validation/package.json ./shared-validation/
COPY school-dashboard/package.json ./school-dashboard/
COPY school-dashboard/owlin-sdk/package.json ./school-dashboard/owlin-sdk/
COPY parent-app/package.json ./parent-app/
COPY staff-app/package.json ./staff-app/
COPY owlin/package.json ./owlin/
COPY owlin/sdk/package.json ./owlin/sdk/
COPY owlin/server/package.json ./owlin/server/

# Install monorepo + owlin/server deps separately (not in workspaces)
RUN npm ci --legacy-peer-deps \
    && npm --prefix owlin/server ci --legacy-peer-deps

# Copy full source
COPY . .

# ─── school-dashboard ───────────────────────────────────────
FROM builder-base AS builder-dashboard
ENV VITE_API_URL=http://localhost:3001/api
ENV VITE_SOCKET_URL=http://localhost:3001
ENV VITE_APP_VERSION=1.0.0
RUN npm run build -w school-dashboard

FROM nginx:1.27-alpine AS school-dashboard
COPY --from=builder-dashboard /app/school-dashboard/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80

# ─── parent-app (Expo web) ──────────────────────────────────
FROM builder-base AS builder-parent
ENV EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
ENV EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
RUN npm run build:web -w parent-app

FROM nginx:1.27-alpine AS parent-app
COPY --from=builder-parent /app/parent-app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80

# ─── staff-app (Expo web) ───────────────────────────────────
FROM builder-base AS builder-staff
ENV EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
ENV EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
RUN npm run build:web -w staff-app

FROM nginx:1.27-alpine AS staff-app
COPY --from=builder-staff /app/staff-app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80

# ─── owlin-web ──────────────────────────────────────────────
FROM builder-base AS builder-owlin-web
ENV VITE_API_URL=http://localhost:4001/api
ENV VITE_SOCKET_URL=http://localhost:4001
ENV VITE_API_KEY=owlin-dev-key
RUN npm run build -w owlin

FROM nginx:1.27-alpine AS owlin-web
COPY --from=builder-owlin-web /app/owlin/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80

# ─── owlin-server ───────────────────────────────────────────
FROM builder-base AS builder-owlin-server
RUN npm run build --prefix owlin/server

FROM node:20-alpine AS owlin-server
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder-owlin-server /app/owlin/server/dist ./dist
COPY --from=builder-owlin-server /app/owlin/server/node_modules ./node_modules
COPY --from=builder-owlin-server /app/owlin/server/package.json ./
RUN chown -R appuser:appgroup /app
USER appuser
ENV PORT=4001
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4001/api/v1/health || exit 1
CMD ["node", "dist/index.js"]
