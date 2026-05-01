#!/bin/bash
set -e

cd /home/ubuntu/ReliefLink

echo "Reading passwords from .env..."
AUTH_PASS=$(grep ^AUTH_DB_PASSWORD .env | cut -d= -f2)
REQUEST_PASS=$(grep ^REQUEST_DB_PASSWORD .env | cut -d= -f2)
VOLUNTEER_PASS=$(grep ^VOLUNTEER_DB_PASSWORD .env | cut -d= -f2)
NOTIFICATION_PASS=$(grep ^NOTIFICATION_DB_PASSWORD .env | cut -d= -f2)

echo "Running auth-service migrations..."
AUTH_DATABASE_URL="postgresql://auth_user:${AUTH_PASS}@localhost:5432/auth_service_db" \
  pnpm --filter @relieflink/auth-service exec prisma migrate deploy --schema=prisma/schema.prisma
echo "✓ auth-service migrations done"

echo "Running request-service migrations..."
REQUEST_DATABASE_URL="postgresql://request_user:${REQUEST_PASS}@localhost:5433/request_service_db" \
  pnpm --filter @relieflink/request-service exec prisma migrate deploy --schema=prisma/schema.prisma
echo "✓ request-service migrations done"

echo "Running volunteer-service migrations..."
VOLUNTEER_DATABASE_URL="postgresql://volunteer_user:${VOLUNTEER_PASS}@localhost:5434/volunteer_service_db" \
  pnpm --filter @relieflink/volunteer-service exec prisma migrate deploy --schema=prisma/schema.prisma
echo "✓ volunteer-service migrations done"

echo "Running notification-service migrations..."
NOTIFICATION_DATABASE_URL="postgresql://notification_user:${NOTIFICATION_PASS}@localhost:5435/notification_service_db" \
  pnpm --filter @relieflink/notification-service exec prisma migrate deploy --schema=prisma/schema.prisma
echo "✓ notification-service migrations done"

echo ""
echo "All migrations completed successfully!"
