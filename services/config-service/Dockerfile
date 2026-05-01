FROM node:20.19-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/config-service/package.json services/config-service/
RUN pnpm install --frozen-lockfile --filter @relieflink/config-service...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/config-service/node_modules ./services/config-service/node_modules
COPY services/config-service services/config-service
COPY tsconfig.json ./

RUN pnpm --filter @relieflink/config-service build

FROM node:20.19-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
WORKDIR /app

COPY --from=builder --chown=appuser:nodejs /app/services/config-service/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/services/config-service/package.json ./

ENV NODE_ENV=production
USER appuser
EXPOSE 3006
CMD ["node", "dist/main.js"]
