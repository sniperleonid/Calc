import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const uiRoot = resolve(root, 'apps/launcher-ui');
const logsRoot = resolve(root, 'logs');
const port = Number(process.env.UI_PORT ?? 8080);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function listLogs() {
  if (!existsSync(logsRoot)) {
    return [];
  }

  return readdirSync(logsRoot)
    .map((name) => ({ name, path: resolve(logsRoot, name) }))
    .filter((entry) => entry.path.startsWith(logsRoot) && existsSync(entry.path) && statSync(entry.path).isFile())
    .map((entry) => ({
      name: entry.name,
      size: statSync(entry.path).size,
      updatedAt: statSync(entry.path).mtime.toISOString(),
    }))
    .sort((a, b) => (a.name > b.name ? 1 : -1));
}

const server = createServer((req, res) => {
  if (req.url === '/api/logs') {
    sendJson(res, 200, { files: listLogs() });
    return;
  }

  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = resolve(uiRoot, `.${urlPath}`);

  if (!filePath.startsWith(uiRoot) || !existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);
  const body = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' });
  res.end(body);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[ui-server] started at http://localhost:${port}`);
});
