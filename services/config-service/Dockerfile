FROM node:20.19-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/config-service/package.json services/config-service/
RUN pnpm install --frozen-lockfile --filter @relieflink/config-service...

FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/config-service/node_modules ./services/config-service/node_modules
COPY services/config-service services/config-service
COPY tsconfig.json ./

RUN pnpm --filter @relieflink/config-service build

FROM node:20.19-alpine AS runner
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
WORKDIR /app

COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/services/config-service/node_modules ./services/config-service/node_modules
COPY --from=builder --chown=appuser:nodejs /app/services/config-service/dist ./services/config-service/dist
COPY --from=builder --chown=appuser:nodejs /app/services/config-service/package.json ./services/config-service/package.json

ENV NODE_ENV=production
WORKDIR /app/services/config-service
USER appuser
EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3006/health || exit 1

CMD ["node", "dist/main.js"]
