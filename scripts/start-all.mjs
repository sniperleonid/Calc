import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();

function run(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    ...options
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  return child;
}

const ballistics = run(
  'ballistics-core',
  'python3',
  ['-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8000'],
  { cwd: resolve(root, 'services/ballistics-core') }
);

const gateway = run(
  'realtime-gateway',
  'node',
  ['services/realtime-gateway/src/runtime.js'],
  { cwd: root }
);

function shutdown(signal) {
  console.log(`received ${signal}, shutting down services...`);
  ballistics.kill('SIGINT');
  gateway.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
