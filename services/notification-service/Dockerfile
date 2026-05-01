FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json packages/types/
COPY packages/validators/package.json packages/validators/
COPY packages/config/package.json packages/config/
COPY packages/logger/package.json packages/logger/
COPY packages/utils/package.json packages/utils/
COPY packages/queue/package.json packages/queue/
COPY services/notification-service/package.json services/notification-service/
RUN pnpm install --frozen-lockfile --filter @relieflink/notification-service...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services/notification-service/node_modules ./services/notification-service/node_modules
COPY packages packages
COPY services/notification-service services/notification-service
COPY tsconfig.json ./

# Dummy DATABASE_URL for Prisma generate (not used at runtime)
ENV NOTIFICATION_DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm --filter @relieflink/types build && \
    pnpm --filter @relieflink/validators build && \
    pnpm --filter @relieflink/config build && \
    pnpm --filter @relieflink/logger build && \
    pnpm --filter @relieflink/utils build && \
    pnpm --filter @relieflink/queue build && \
    pnpm --filter @relieflink/notification-service db:generate && \
    pnpm --filter @relieflink/notification-service build

FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
WORKDIR /app

COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/types/package.json ./packages/types/
COPY --from=builder --chown=appuser:nodejs /app/packages/validators/dist ./packages/validators/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/validators/package.json ./packages/validators/
COPY --from=builder --chown=appuser:nodejs /app/packages/config/dist ./packages/config/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/config/package.json ./packages/config/
COPY --from=builder --chown=appuser:nodejs /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/logger/package.json ./packages/logger/
COPY --from=builder --chown=appuser:nodejs /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/utils/package.json ./packages/utils/
COPY --from=builder --chown=appuser:nodejs /app/packages/queue/dist ./packages/queue/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/queue/package.json ./packages/queue/
COPY --from=builder --chown=appuser:nodejs /app/services/notification-service/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/services/notification-service/generated ./generated
COPY --from=builder --chown=appuser:nodejs /app/services/notification-service/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/services/notification-service/prisma ./prisma

ENV NODE_ENV=production
USER appuser
EXPOSE 3004
CMD ["node", "dist/main.js"]
