ALTER TABLE auth_service."User"
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
