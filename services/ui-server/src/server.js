import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const uiRoot = resolve(root, 'apps/launcher-ui');
const logsRoot = resolve(root, 'logs');
const uploadsRoot = resolve(root, 'data/uploads/map-images');
const port = Number(process.env.UI_PORT ?? 8080);
const maxMapImageBytes = 150 * 1024 * 1024;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const imageExtensionByType = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
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

function saveMapImage(req, res) {
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  const extension = imageExtensionByType[contentType];
  if (!extension) {
    sendJson(res, 415, { error: 'Only PNG, JPEG and WEBP are supported.' });
    return;
  }

  const chunks = [];
  let total = 0;
  let tooLarge = false;

  req.on('data', (chunk) => {
    total += chunk.length;
    if (total > maxMapImageBytes) {
      tooLarge = true;
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('close', () => {
    if (tooLarge && !res.writableEnded) {
      sendJson(res, 413, { error: 'Map image exceeds 150 MB limit.' });
    }
  });

  req.on('end', () => {
    if (tooLarge || res.writableEnded) {
      return;
    }

    mkdirSync(uploadsRoot, { recursive: true });
    for (const existing of readdirSync(uploadsRoot)) {
      const path = resolve(uploadsRoot, existing);
      if (path.startsWith(uploadsRoot) && statSync(path).isFile()) {
        unlinkSync(path);
      }
    }

    const fileName = `map-${Date.now()}.${extension}`;
    const outputPath = resolve(uploadsRoot, fileName);
    writeFileSync(outputPath, Buffer.concat(chunks));
    sendJson(res, 200, { url: `/map-images/${fileName}` });
  });
}

const server = createServer((req, res) => {
  if (req.url === '/api/logs') {
    sendJson(res, 200, { files: listLogs() });
    return;
  }

  if (req.url === '/api/map-image' && req.method === 'POST') {
    saveMapImage(req, res);
    return;
  }

  if (req.url?.startsWith('/map-images/')) {
    const fileName = req.url.replace('/map-images/', '');
    const filePath = resolve(uploadsRoot, fileName);
    if (!filePath.startsWith(uploadsRoot) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const body = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
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
