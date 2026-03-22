CREATE SCHEMA IF NOT EXISTS notification_service;

CREATE TYPE notification_service."NotificationChannel" AS ENUM ('in_app', 'email');
CREATE TYPE notification_service."DeliveryStatus" AS ENUM ('queued', 'delivered', 'failed');

CREATE TABLE notification_service."Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "channel" notification_service."NotificationChannel" NOT NULL DEFAULT 'in_app',
  "deliveryStatus" notification_service."DeliveryStatus" NOT NULL DEFAULT 'delivered',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE notification_service."StatusEvent" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "oldStatus" TEXT NOT NULL,
  "newStatus" TEXT NOT NULL,
  "changedBy" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);
