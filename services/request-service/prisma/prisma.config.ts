import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),

  migrate: {
    async url() {
      return process.env.REQUEST_DATABASE_URL || 'postgresql://postgres:12345q@localhost:5432/request_service_db';
    }
  }
});
