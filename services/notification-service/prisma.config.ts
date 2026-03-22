import 'dotenv/config';
import path from 'path';
import { defineConfig, env } from 'prisma/config';

// Load .env from root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('NOTIFICATION_DATABASE_URL'),
  },
});
