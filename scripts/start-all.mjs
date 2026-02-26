import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();

function findPython() {
  const candidates = process.platform === 'win32' ? [['py', ['-3']], ['python', []], ['python3', []]] : [['python3', []], ['python', []]];

  for (const [cmd, prefix] of candidates) {
    const probe = spawnSync(cmd, [...prefix, '--version'], { stdio: 'ignore' });
    if (probe.status === 0) {
      return { cmd, argsPrefix: prefix };
    }
  }
  return null;
}


function hasUvicorn(python) {
  const probe = spawnSync(python.cmd, [...python.argsPrefix, '-c', 'import uvicorn'], { stdio: 'ignore' });
  return probe.status === 0;
}

function run(name, command, args, options = {}) {
  const child = spawn(command, args, { stdio: 'inherit', ...options });
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

const children = [];
const python = findPython();
if (!python) {
  console.error('[ballistics-core] Python not found. Install Python 3.10+ and dependencies from services/ballistics-core/requirements.txt');
} else if (!hasUvicorn(python)) {
  console.error('[ballistics-core] Module uvicorn is missing. Run: pip install -r services/ballistics-core/requirements.txt');
} else {
  children.push(run('ballistics-core', python.cmd, [...python.argsPrefix, '-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8000'], { cwd: resolve(root, 'services/ballistics-core') }));
}

children.push(run('realtime-gateway', 'node', ['services/realtime-gateway/src/runtime.js'], { cwd: root }));
children.push(run('ui-server', 'node', ['services/ui-server/src/server.js'], { cwd: root }));

console.log('UI available at http://localhost:8080');

function shutdown(signal) {
  console.log(`received ${signal}, shutting down services...`);
  for (const child of children) {
    child.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
