# palang-web — Docker image.
#
# ONE image, two layers:
#   Stage 1 (ui)    builds the APP-ONLY bundle (VITE_MODE=app): the landing
#                   page, entry modal and promo copy are tree-shaken OUT.
#                   Users land straight in the Convert tool.
#   Stage 2 (engine) installs the reference engine (palang core, public repo)
#                   and serves the UI from it - the same setup the live site
#                   runs: palang-server + PALANG_WEB_DIST.
#
# Build:   docker build -t palang-web .
# Run:     docker run -p 8000:8000 palang-web
# Or:      docker compose up -d
#
# Override the operator limits without rebuilding:
#   docker run -p 8000:8000 -v ./limits.json:/app/dist/limits.json:ro palang-web

FROM node:22-alpine AS ui
WORKDIR /ui
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN VITE_MODE=app npm run build

FROM python:3.12-slim AS engine
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
# The reference engine (github.com/farithadnan/palang, MIT). Cloned at build
# time so this repo stays self-contained; the core is never patched here.
RUN git clone --depth 1 https://github.com/farithadnan/palang /tmp/palang \
    && pip install --no-cache-dir /tmp/palang \
    && rm -rf /tmp/palang /root/.cache
COPY --from=ui /ui/dist /app/dist
ENV PALANG_WEB_DIST=/app/dist \
    PALANG_HOST=0.0.0.0 \
    PALANG_PORT=8000
EXPOSE 8000
CMD ["palang-server"]
