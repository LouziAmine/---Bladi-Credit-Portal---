# Build stage: production configuration: the API is reached through the same origin (/api/v1),
# proxied by nginx below.
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage: unprivileged nginx serving the SPA and reverse-proxying /api/ to the backend
# (deploy/nginx/default.conf.template: CSP with a per-response nonce, HSTS, cache policy, SSE-friendly proxy).
FROM nginxinc/nginx-unprivileged:1.27-alpine
ENV NGINX_PORT=8080 \
    API_UPSTREAM=http://backend:8080

COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/bladi-credit-portal/browser /usr/share/nginx/html

EXPOSE 8080
