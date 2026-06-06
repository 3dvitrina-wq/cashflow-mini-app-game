# Server image for Fly.io (or any single-port container host).
# Monorepo-aware: game-engine/shared are plain TS sources imported by relative
# path and executed via tsx, so we just need the repo tree + npm deps.
FROM node:20-slim

WORKDIR /app

# Install only root + server deps (skips the heavy web workspace).
# Lockfile is the monorepo lock; `npm install --workspace` resolves the subset.
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
RUN npm install --include-workspace-root --workspace apps/server \
      --no-audit --no-fund

# Source: TS packages + server. tsx transpiles on the fly at runtime.
COPY packages ./packages
COPY apps/server ./apps/server

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080

CMD ["npx", "tsx", "apps/server/src/index.ts"]
