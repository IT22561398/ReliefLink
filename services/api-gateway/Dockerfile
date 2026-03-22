FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/config/package.json packages/config/
COPY packages/logger/package.json packages/logger/
COPY services/api-gateway/package.json services/api-gateway/
RUN pnpm install --frozen-lockfile --filter @relieflink/api-gateway...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=deps /app/packages/logger/node_modules ./packages/logger/node_modules
COPY --from=deps /app/services/api-gateway/node_modules ./services/api-gateway/node_modules
COPY packages/config packages/config
COPY packages/logger packages/logger
COPY services/api-gateway services/api-gateway
COPY tsconfig.json ./

RUN pnpm --filter @relieflink/config build && \
    pnpm --filter @relieflink/logger build && \
    pnpm --filter @relieflink/api-gateway build

FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
WORKDIR /app

COPY --from=builder --chown=appuser:nodejs /app/packages/config/dist ./packages/config/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/config/package.json ./packages/config/
COPY --from=builder --chown=appuser:nodejs /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/logger/package.json ./packages/logger/
COPY --from=builder --chown=appuser:nodejs /app/services/api-gateway/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/services/api-gateway/package.json ./

ENV NODE_ENV=production
USER appuser
EXPOSE 3005
CMD ["node", "dist/main.js"]
