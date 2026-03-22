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
COPY packages/auth-middleware/package.json packages/auth-middleware/
COPY services/volunteer-service/package.json services/volunteer-service/
RUN pnpm install --frozen-lockfile --filter @relieflink/volunteer-service...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services/volunteer-service/node_modules ./services/volunteer-service/node_modules
COPY packages packages
COPY services/volunteer-service services/volunteer-service
COPY tsconfig.json ./

RUN pnpm --filter @relieflink/types build && \
    pnpm --filter @relieflink/validators build && \
    pnpm --filter @relieflink/config build && \
    pnpm --filter @relieflink/logger build && \
    pnpm --filter @relieflink/utils build && \
    pnpm --filter @relieflink/auth-middleware build && \
    pnpm --filter @relieflink/volunteer-service db:generate && \
    pnpm --filter @relieflink/volunteer-service build

FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
WORKDIR /app

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
COPY --from=builder --chown=appuser:nodejs /app/packages/auth-middleware/dist ./packages/auth-middleware/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/auth-middleware/package.json ./packages/auth-middleware/
COPY --from=builder --chown=appuser:nodejs /app/services/volunteer-service/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/services/volunteer-service/generated ./generated
COPY --from=builder --chown=appuser:nodejs /app/services/volunteer-service/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/services/volunteer-service/prisma ./prisma

ENV NODE_ENV=production
USER appuser
EXPOSE 3003
CMD ["node", "dist/main.js"]
