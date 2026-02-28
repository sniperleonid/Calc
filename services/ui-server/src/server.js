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
const appsRoot = resolve(root, 'apps');
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

function tryServeStaticFile(res, baseDir, requestedPath) {
  const normalizedPath = String(requestedPath || '').replace(/^\/+/, '');
  const filePath = resolve(baseDir, normalizedPath);
  if (!filePath.startsWith(baseDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    return false;
  }

  const ext = extname(filePath).toLowerCase();
  const body = readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  res.end(body);
  return true;
}

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
      return execFileSync(candidate.command, candidate.args, { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
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
    if descr.endswith('f4'):
      fmt = '<' + 'f'*cnt
      return list(struct.unpack_from(fmt, data, start))
    if descr.endswith('f8'):
      fmt = '<' + 'd'*cnt
      return list(struct.unpack_from(fmt, data, start))
    if descr.endswith('i4'):
      fmt = '<' + 'i'*cnt
      return list(struct.unpack_from(fmt, data, start))
    return []

def per100m(values, ranges, idx):
    if not values or not ranges:
        return None
    left = max(0, idx - 1)
    right = min(len(values) - 1, idx + 1)
    if left == right:
        return None
    dr = ranges[right] - ranges[left]
    if dr == 0:
        return None
    return ((values[right] - values[left]) / dr) * 100

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
    ranges = arrays.get(f'range_c{cid}', [])
    tofs = arrays.get(f'tof_c{cid}', [])
    delev = arrays.get(f'delev_c{cid}', [])
    tof_per = arrays.get(f'tofPer100m_c{cid}', [])
    range_table = []
    size = min(len(ranges), len(elev))
    for i in range(size):
        range_table.append({
            'range': ranges[i],
            'elevation': elev[i],
            'tof': tofs[i] if i < len(tofs) else None,
            'dElev': delev[i] if i < len(delev) else per100m(elev, ranges, i),
            'tofPer100m': tof_per[i] if i < len(tof_per) else per100m(tofs, ranges, i),
        })
    by_charge[cid] = {
        'range': ranges,
        'elevationMil': elev,
        'tof': tofs,
        'dElev': delev,
        'tofPer100m': tof_per,
        'rangeTable': range_table,
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

function parseTableFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.json') {
    const parsed = safeReadJson(filePath);
    if (!parsed) {
      throw new Error(`Invalid JSON table: ${filePath}`);
    }
    return parsed;
  }
  return parseNpzTable(filePath);
}

function inferMilsPerCircle(gunId, gunProfile = {}, primaryTable = null) {
  const explicit = Number(gunProfile.mil_system?.mils_per_circle ?? gunProfile.milsPerCircle);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const tableValue = Number(primaryTable?.meta?.milsPerCircle ?? primaryTable?.meta?.mils_per_circle);
  if (Number.isFinite(tableValue) && tableValue > 0) return tableValue;

  const natoIds = new Set(['M777', 'M252']);
  if (natoIds.has(gunId)) return 6400;
  return 6000;
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
            .filter((fileEntry) => {
              if (!fileEntry.isFile()) return false;
              const ext = extname(fileEntry.name).toLowerCase();
              return ext === '.npz' || ext === '.json';
            })
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
    .filter((fileEntry) => {
      if (!fileEntry.isFile()) return false;
      const ext = extname(fileEntry.name).toLowerCase();
      return ext === '.npz' || ext === '.json';
    })
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
      .map(([key, value]) => [key, `/api/ballistics/table?path=${encodeURIComponent(`${gunId}/${projectileId}/${value}`)}`]),
  );

  const primaryTableFile = tables.low ?? tables.direct ?? tables.high;
  let primaryTable = null;
  if (primaryTableFile) {
    const filePath = resolve(projectilePath, primaryTableFile);
    primaryTable = parseTableFile(filePath);
  }

  return {
    weaponId: `${gunId}/${projectileId}`,
    displayName: `${gunProfile.name ?? gunId} ${projectileId}`,
    minElevMil: Number(gunProfile.min_elevation_mil ?? 0),
    maxElevMil: Number(gunProfile.max_elevation_mil ?? 1550),
    tables: tableUrls,
    milSystem: {
      milsPerCircle: inferMilsPerCircle(gunId, gunProfile, primaryTable),
    },
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
    try {
      sendJson(res, 200, parseTableFile(filePath));
    } catch (error) {
      sendJson(res, 500, { error: String(error?.message || error || 'Failed to parse table.') });
    }
    return;
  }

  if (req.url?.startsWith('/api/ballistics/weapon') && req.method === 'GET') {
    const parsed = new URL(req.url, 'http://localhost');
    let weapon = null;
    try {
      weapon = await buildWeaponFromCatalog(parsed.searchParams.get('weaponId'));
    } catch (error) {
      sendJson(res, 500, { error: String(error?.message || error || 'Failed to load weapon.') });
      return;
    }
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

  if (req.url?.startsWith('/apps/')) {
    const served = tryServeStaticFile(res, appsRoot, req.url.replace('/apps/', '/'));
    if (!served) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
    return;
  }

  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const served = tryServeStaticFile(res, uiRoot, urlPath);
  if (!served) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[ui-server] started at http://localhost:${port}`);
});
