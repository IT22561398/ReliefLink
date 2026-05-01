ALTER TABLE notification_service."Notification"
ADD COLUMN IF NOT EXISTS "metadata" JSONB;
