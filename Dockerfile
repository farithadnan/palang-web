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
#
# The engine is pinned to a commit for reproducible builds: bump
# ARG PALANG_CORE_REF when the core moves and you want the new engine.

FROM node:22-alpine AS ui
WORKDIR /ui
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY vite.config.js ./
COPY index.html ./
RUN npm run build:app

FROM python:3.12-slim AS engine
ARG PALANG_CORE_REF=1cb987ffc021da234847b7db23fcd880996ec83b
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
# The reference engine (github.com/farithadnan/palang, MIT). Pinned to a
# commit and fetched with a build-time read token so it works while the repo
# is private (and later, public). The token is a buildkit SECRET: it never
# lands in image layers or history. Public repo -> no token needed.
#
#   docker build -t palang-web --secret id=core_token,env=CORE_READ_TOKEN .
#   docker build -t palang-web .                          # once the repo is public
RUN --mount=type=secret,id=core_token,required=false \
    pip install --no-cache-dir \
      "https://x-access-token:$(cat /run/secrets/core_token 2>/dev/null || echo x)@github.com/farithadnan/palang/archive/${PALANG_CORE_REF}.tar.gz" \
    && rm -rf /root/.cache
COPY --from=ui /ui/dist /app/dist
ENV PALANG_WEB_DIST=/app/dist \
    PALANG_HOST=0.0.0.0 \
    PALANG_PORT=8000
# Serve as an unprivileged user (port 8000 needs no root).
RUN useradd --create-home --uid 10001 palang && chown -R palang:palang /app
USER palang
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/version.json')" || exit 1
CMD ["palang-server"]
