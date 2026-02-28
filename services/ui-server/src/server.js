import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const uiRoot = resolve(root, 'apps/launcher-ui');
const logsRoot = resolve(root, 'logs');
const uploadsRoot = resolve(root, 'data/uploads/map-images');
const tablesRoot = resolve(root, 'tables');
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

function safeReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}


function runPythonScript(script, filePath) {
  const candidates = [
    { command: 'python3', args: ['-c', script, filePath] },
    { command: 'python', args: ['-c', script, filePath] },
    { command: 'py', args: ['-3', '-c', script, filePath] },
  ];

  const errors = [];
  for (const candidate of candidates) {
    try {
      return execFileSync(candidate.command, candidate.args, { encoding: 'utf-8' });
    } catch (error) {
      errors.push(`${candidate.command}: ${error.message}`);
    }
  }

  throw new Error(`Unable to parse NPZ table. Python runtime was not found. Tried: ${errors.join(' | ')}`);
}

function parseNpzTable(filePath) {
  const script = `
import json, zipfile, struct
from pathlib import Path

def parse_npy(data):
    major = data[6]
    if major <= 1:
        hlen = struct.unpack('<H', data[8:10])[0]
        off = 10
    else:
        hlen = struct.unpack('<I', data[8:12])[0]
        off = 12
    header = data[off:off+hlen].decode('latin1')
    descr = header.split("'descr':")[1].split(',')[0].strip().strip("'")
    shape_raw = header.split("'shape':")[1].split(')')[0].strip().lstrip('(')
    shape = [int(x.strip()) for x in shape_raw.split(',') if x.strip()]
    cnt = 1
    for x in shape: cnt *= x
    start = off + hlen
    out = []
    if descr.endswith('f4'):
      fmt = '<' + 'f'*cnt
      out = list(struct.unpack_from(fmt, data, start))
    elif descr.endswith('f8'):
      fmt = '<' + 'd'*cnt
      out = list(struct.unpack_from(fmt, data, start))
    elif descr.endswith('i4'):
      fmt = '<' + 'i'*cnt
      out = list(struct.unpack_from(fmt, data, start))
    else:
      out = []
    return out

import sys
path = Path(sys.argv[1])
arrays = {}
with zipfile.ZipFile(path, 'r') as z:
    for name in z.namelist():
        if not name.endswith('.npy'): continue
        arrays[name[:-4]] = parse_npy(z.read(name))

elev = arrays.get('elev_mil', [])
charges = [str(int(c)) if float(c).is_integer() else str(c) for c in arrays.get('charges_id', [])]
by_charge = {}
for cid in charges:
    by_charge[cid] = {
        'range': arrays.get(f'range_c{cid}', []),
        'elevationMil': elev,
        'tof': arrays.get(f'tof_c{cid}')
    }

print(json.dumps({
    'format':'legacy-npz',
    'elevMil': elev,
    'charges': charges,
    'byCharge': by_charge,
    'meta': {
      'dragCoeff': (arrays.get('meta_air_drag') or [None])[0],
      'massKg': (arrays.get('meta_mass') or [None])[0],
    }
}))
`
  const raw = runPythonScript(script, filePath);
  return JSON.parse(raw);
}

function listArtilleryCatalog() {
  if (!existsSync(tablesRoot)) {
    return { guns: [] };
  }

  const guns = readdirSync(tablesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((gunId) => {
      const gunPath = resolve(tablesRoot, gunId);
      const profilePath = resolve(gunPath, 'profile.json');
      const profile = existsSync(profilePath) ? safeReadJson(profilePath) : null;

      const projectiles = readdirSync(gunPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
          const projectileId = entry.name;
          const projectilePath = resolve(gunPath, projectileId);
          const projectileProfilePath = resolve(projectilePath, 'profile.json');
          const projectileProfile = existsSync(projectileProfilePath) ? safeReadJson(projectileProfilePath) : null;
          const ballisticTables = readdirSync(projectilePath, { withFileTypes: true })
            .filter((fileEntry) => fileEntry.isFile() && extname(fileEntry.name).toLowerCase() === '.npz')
            .map((fileEntry) => fileEntry.name)
            .sort((a, b) => a.localeCompare(b, 'en'));

          return {
            id: projectileId,
            profile: projectileProfile,
            ballisticTables,
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id, 'en'));

      return {
        id: gunId,
        profile,
        projectiles,
      };
    });

  return { guns };
}

function safeTablePath(relativePath) {
  const normalized = String(relativePath || '').replace(/^\/+/, '');
  const full = resolve(tablesRoot, normalized);
  if (!full.startsWith(tablesRoot)) return null;
  return full;
}

async function buildWeaponFromCatalog(weaponId) {
  const [gunId, projectileId] = String(weaponId || '').split('/');
  if (!gunId || !projectileId) return null;
  const gunProfile = safeReadJson(resolve(tablesRoot, gunId, 'profile.json')) ?? {};
  const projectilePath = resolve(tablesRoot, gunId, projectileId);
  if (!existsSync(projectilePath) || !statSync(projectilePath).isDirectory()) return null;

  const tableFiles = readdirSync(projectilePath, { withFileTypes: true })
    .filter((fileEntry) => fileEntry.isFile() && extname(fileEntry.name).toLowerCase() === '.npz')
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));

  const tables = {
    direct: tableFiles.find((name) => name.includes('direct')),
    low: tableFiles.find((name) => name.includes('low')),
    high: tableFiles.find((name) => name.includes('high')),
  };

  const tableUrls = Object.fromEntries(
    Object.entries(tables)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => [key, `/api/ballistics/file?path=${encodeURIComponent(`${gunId}/${projectileId}/${value}`)}`]),
  );

  const primaryTableFile = tables.low ?? tables.direct ?? tables.high;
  let primaryTable = null;
  if (primaryTableFile) {
    const filePath = resolve(projectilePath, primaryTableFile);
    primaryTable = parseNpzTable(filePath);
  }

  return {
    weaponId: `${gunId}/${projectileId}`,
    displayName: `${gunProfile.name ?? gunId} ${projectileId}`,
    maxElevMil: Number(gunProfile.max_elevation_mil ?? 1550),
    tables: tableUrls,
    primaryTable,
  };
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

function getLogsDirectoryPath() {
  return logsRoot;
}

function openLogsDirectory() {
  return new Promise((resolvePromise, reject) => {
    if (!existsSync(logsRoot)) {
      mkdirSync(logsRoot, { recursive: true });
    }

    const platform = process.platform;
    const command = platform === 'win32'
      ? { file: 'explorer', args: [logsRoot] }
      : platform === 'darwin'
        ? { file: 'open', args: [logsRoot] }
        : { file: 'xdg-open', args: [logsRoot] };

    execFile(command.file, command.args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolvePromise();
    });
  });
}


function getLatestMapImageUrl() {
  if (!existsSync(uploadsRoot)) return null;

  const latest = readdirSync(uploadsRoot)
    .map((name) => ({ name, path: resolve(uploadsRoot, name) }))
    .filter((entry) => entry.path.startsWith(uploadsRoot) && existsSync(entry.path) && statSync(entry.path).isFile())
    .map((entry) => ({
      name: entry.name,
      mtimeMs: statSync(entry.path).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];

  return latest ? `/map-images/${latest.name}` : null;
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

const server = createServer(async (req, res) => {
  if (req.url === '/api/logs') {
    sendJson(res, 200, { files: listLogs(), logsDirectory: getLogsDirectoryPath() });
    return;
  }

  if (req.url === '/api/logs/open' && req.method === 'POST') {
    openLogsDirectory()
      .then(() => {
        sendJson(res, 200, { ok: true, logsDirectory: getLogsDirectoryPath() });
      })
      .catch(() => {
        sendJson(res, 500, { error: 'Failed to open logs directory.' });
      });
    return;
  }

  if (req.url === '/api/map-image' && req.method === 'POST') {
    saveMapImage(req, res);
    return;
  }
  if (req.url === '/api/map-image/latest' && req.method === 'GET') {
    const url = getLatestMapImageUrl();
    sendJson(res, 200, { url });
    return;
  }

  if (req.url === '/api/artillery-catalog' && req.method === 'GET') {
    sendJson(res, 200, listArtilleryCatalog());
    return;
  }

  if (req.url?.startsWith('/api/ballistics/file') && req.method === 'GET') {
    const parsed = new URL(req.url, 'http://localhost');
    const relativePath = parsed.searchParams.get('path') || '';
    const filePath = safeTablePath(relativePath);
    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
      sendJson(res, 404, { error: 'File not found.' });
      return;
    }
    const ext = extname(filePath).toLowerCase();
    const type = ext === '.npz' ? 'application/octet-stream' : 'application/json; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(readFileSync(filePath));
    return;
  }


  if (req.url?.startsWith('/api/ballistics/table') && req.method === 'GET') {
    const parsed = new URL(req.url, 'http://localhost');
    const relativePath = parsed.searchParams.get('path') || '';
    const filePath = safeTablePath(relativePath);
    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
      sendJson(res, 404, { error: 'Table not found.' });
      return;
    }
    sendJson(res, 200, parseNpzTable(filePath));
    return;
  }

  if (req.url?.startsWith('/api/ballistics/weapon') && req.method === 'GET') {
    const parsed = new URL(req.url, 'http://localhost');
    const weapon = await buildWeaponFromCatalog(parsed.searchParams.get('weaponId'));
    if (!weapon) {
      sendJson(res, 404, { error: 'Weapon not found.' });
      return;
    }
    sendJson(res, 200, weapon);
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
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  res.end(body);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[ui-server] started at http://localhost:${port}`);
});
