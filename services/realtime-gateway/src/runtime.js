import { RealtimeGateway } from './server.js';
import { logger } from './logger.js';
import { createServer } from 'node:http';

const gateway = new RealtimeGateway();
const port = Number(process.env.GATEWAY_PORT ?? 3001);

gateway.subscribe('gun.status', (event) => {
  logger.info('gun.status delivered', { missionId: event.missionId, gunId: event.gunId });
});

logger.info('realtime-gateway started');
logger.info('waiting for events from integration clients');

const healthServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({ status: 'not-found' }));
});

healthServer.listen(port, '0.0.0.0', () => {
  logger.info('realtime-gateway health endpoint started', { port });
});

const heartbeat = setInterval(() => {
  logger.info('realtime-gateway heartbeat');
}, 30000);

process.on('SIGINT', () => {
  clearInterval(heartbeat);
  healthServer.close();
  logger.info('realtime-gateway stopped by SIGINT');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('uncaughtException', { error: String(error) });
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason: String(reason) });
});
