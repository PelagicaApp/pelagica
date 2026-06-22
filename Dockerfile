# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile

COPY frontend .
RUN pnpm run build


# Stage 2: Build backend
FROM golang:1.25-alpine AS backend-builder

WORKDIR /backend

ARG TARGETOS
ARG TARGETARCH

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend .
RUN CGO_ENABLED=0 \ 
    GOOS=$TARGETOS \
    GOARCH=$TARGETARCH \
    go build -o server ./


# Stage 3: Final image
FROM nginx:alpine

ARG APP_VERSION
ARG COLLECTOR_PING_TOKEN

# runtime essentials
RUN apk add --no-cache ca-certificates tzdata

# frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# backend
COPY --from=backend-builder /backend/server /server
COPY --from=backend-builder /backend/default.theme.json /default.theme.json

# nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# config directory (volume-friendly)
RUN mkdir -p /config

ENV APP_VERSION=$APP_VERSION
ENV PORT=4321
ENV LOG_LEVEL=info
ENV LOG_FILE=/config/logs/pelagica.log
ENV ENABLE_AUTH=true
ENV CONFIG_PATH=/config/config.json
ENV THEMES_DIR=/config/themes
ENV STUDIO_THUMBS=/config/studio_thumbs
ENV DEFAULT_THEME_PATH=/default.theme.json
ENV BRANDING_DIR=/config/branding
ENV THEMES_REPO_BASE_URL=https://themes.pelagica.app/
ENV COLLECTOR_PING_BASE_URL=https://stats.pelagica.app
ENV COLLECTOR_PING_TOKEN=$COLLECTOR_PING_TOKEN
ENV COLLECTOR_INSTANCE_ID_FILE=/config/instance_id
ENV COLLECTOR_STATS_CONSENT_FILE=/config/stats_consent

EXPOSE 80

# start backend + nginx
CMD ["/bin/sh", "-c", "exec /server & exec nginx -g 'daemon off;'"]