import { createApp } from './app.js';
import { config } from './config/index.js';
import { createLogger } from '@relieflink/logger';
import { refreshServiceUrls } from './proxy/proxy.service.js';
const logger = createLogger({ service: 'api-gateway', level: config.logLevel });

async function main() {
  await refreshServiceUrls();
  
  const app = createApp();
  
  const server = app.listen(config.port, () => {
    logger.info(`API Gateway running on http://localhost:${config.port}`, {
      env: config.env,
      port: config.port
    });
  });
  
  const configRefreshInterval = setInterval(() => {
    refreshServiceUrls().catch((error) => {
      logger.debug('Config refresh failed', { error });
    });
  }, 30000);

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    clearInterval(configRefreshInterval);

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('Fatal error', { error });
  process.exit(1);
});
