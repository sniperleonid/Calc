import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const logDir = resolve(root, 'logs');
mkdirSync(logDir, { recursive: true });

const infoLog = resolve(logDir, 'realtime-gateway.log');
const errorLog = resolve(logDir, 'realtime-gateway-errors.log');

function writeLine(level, message, extra) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...extra
  };
  const line = `${JSON.stringify(payload)}\n`;
  appendFileSync(infoLog, line, 'utf8');
  if (level === 'error') {
    appendFileSync(errorLog, line, 'utf8');
  }
  const fn = level === 'error' ? console.error : console.log;
  fn(`[${payload.ts}] ${level.toUpperCase()} ${message}`);
}

export const logger = {
  info(message, extra = {}) {
    writeLine('info', message, extra);
  },
  error(message, extra = {}) {
    writeLine('error', message, extra);
  }
};
