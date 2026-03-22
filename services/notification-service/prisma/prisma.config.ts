import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),

  migrate: {
    async url() {
      return process.env.NOTIFICATION_DATABASE_URL || 'postgresql://postgres:12345q@localhost:5432/notification_service_db';
    }
  }
});
