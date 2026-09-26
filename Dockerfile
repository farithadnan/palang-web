# palang-web — Docker image.
#
# Single-purpose static image: stage 1 builds the PUBLIC SITE (landing,
# install, privacy, feature pages), stage 2 serves it with nginx. The tools
# ship as the EXE and APK builds only; the container only ships files. No
# backend, no engine, no tokens.
#
# Build:   docker build -t palang-web .
# Run:     docker run -p 8000:80 palang-web
# Or:      docker compose up -d
#
# Override the operator limits without rebuilding:
#   docker run -p 8000:80 -v ./limits.json:/usr/share/nginx/html/limits.json:ro palang-web

FROM node:22-alpine AS ui
WORKDIR /ui
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY vite.config.js ./
COPY index.html ./
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=ui /ui/dist /usr/share/nginx/html
# The official nginx image runs a root master that spawns unprivileged workers
# (its documented default: it needs :80 and the cache dirs at startup).
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/version.json || exit 1
