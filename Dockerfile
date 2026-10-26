# syntax=docker/dockerfile:1

# One image, three commands: web, api, worker. Prisma Client is generated inside
# the Linux image (hard rule 10). Built for Node 22 per docs/12 §3.
FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV NODE_ENV=development

# Prisma config requires a URL even for `generate`; this build-only value never
# connects to a database and is replaced at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY packages/contracts/package.json packages/contracts/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/ledger/package.json packages/ledger/

RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run db:generate
RUN npm run build

# Production dependencies only. Next and Nest are runtime dependencies, so the
# same image can serve web, api and worker.
RUN npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app ./

# Build-time placeholder; the runtime environment always overrides it.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY deploy/entrypoint.sh /usr/local/bin/aimscams-entrypoint
RUN chmod +x /usr/local/bin/aimscams-entrypoint

EXPOSE 3000 4000
ENTRYPOINT ["aimscams-entrypoint"]
CMD ["api"]
