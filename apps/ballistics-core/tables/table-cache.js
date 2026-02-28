import { mapNpzToBallisticTable } from './npz-loader.js';

const cache = new Map();

function cacheKey(weaponId, tablePaths) {
  return `${weaponId}:${JSON.stringify(tablePaths || {})}`;
}

async function loadTable(url) {
  if (url.endsWith('.npz')) {
    const base = globalThis.location?.origin ?? 'http://localhost';
    const parsedUrl = new URL(url, base);
    const path = parsedUrl.searchParams.get('path') || '';
    const api = `/api/ballistics/table?path=${encodeURIComponent(path)}`;
    const response = await fetch(api, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed loading parsed table ${api}`);
    return mapNpzToBallisticTable(await response.json());
  }

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed loading table ${url}`);
  return mapNpzToBallisticTable(await response.json());
}

export async function getTables(weaponId, tablePaths) {
  const key = cacheKey(weaponId, tablePaths);
  if (cache.has(key)) return cache.get(key);
  const result = {};
  if (tablePaths.direct) result.direct = await loadTable(tablePaths.direct);
  if (tablePaths.low) result.low = await loadTable(tablePaths.low);
  if (tablePaths.high) result.high = await loadTable(tablePaths.high);
  cache.set(key, result);
  return result;
}
