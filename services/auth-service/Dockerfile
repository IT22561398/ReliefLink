FROM node:20.11-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json packages/types/
COPY packages/validators/package.json packages/validators/
COPY packages/config/package.json packages/config/
COPY packages/logger/package.json packages/logger/
COPY packages/utils/package.json packages/utils/
COPY packages/auth-middleware/package.json packages/auth-middleware/
COPY services/auth-service/package.json services/auth-service/
COPY services/auth-service/prisma services/auth-service/prisma
RUN pnpm install --frozen-lockfile --filter @relieflink/auth-service...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services/auth-service/node_modules ./services/auth-service/node_modules
COPY packages packages
COPY services/auth-service services/auth-service
COPY tsconfig.json ./

ENV AUTH_DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm --filter @relieflink/types build && \
    pnpm --filter @relieflink/validators build && \
    pnpm --filter @relieflink/config build && \
    pnpm --filter @relieflink/logger build && \
    pnpm --filter @relieflink/utils build && \
    pnpm --filter @relieflink/auth-middleware build && \
    pnpm --filter @relieflink/auth-service run db:generate && \
    pnpm --filter @relieflink/auth-service build

FROM node:20.11-alpine AS runner
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
WORKDIR /app

COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/packages ./packages
COPY --from=builder --chown=appuser:nodejs /app/services/auth-service/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/services/auth-service/generated ./generated
COPY --from=builder --chown=appuser:nodejs /app/services/auth-service/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/services/auth-service/prisma ./prisma

ENV NODE_ENV=production
USER appuser
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

LABEL org.opencontainers.image.title="ReliefLink Auth Service"
LABEL org.opencontainers.image.description="Authentication service for ReliefLink disaster management platform"
LABEL org.opencontainers.image.source="https://github.com/IT22561398/ReliefLink"
LABEL org.opencontainers.image.version="1.0.0"

CMD ["node", "dist/main.js"]
