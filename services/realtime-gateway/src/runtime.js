import { RealtimeGateway } from './server.js';
import { logger } from './logger.js';

const gateway = new RealtimeGateway();

gateway.subscribe('gun.status', (event) => {
  logger.info('gun.status delivered', { missionId: event.missionId, gunId: event.gunId });
});

logger.info('realtime-gateway started');
logger.info('waiting for events from integration clients');

const heartbeat = setInterval(() => {
  logger.info('realtime-gateway heartbeat');
}, 30000);

process.on('SIGINT', () => {
  clearInterval(heartbeat);
  logger.info('realtime-gateway stopped by SIGINT');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('uncaughtException', { error: String(error) });
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason: String(reason) });
});
