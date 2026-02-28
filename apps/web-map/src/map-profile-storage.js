import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export class FileMapProfileStorage {
  constructor({ mapsDir = 'maps' } = {}) {
    this.mapsDir = mapsDir;
  }

  async saveProfile(profileName, payload) {
    if (!profileName) throw new Error('profileName is required');
    await mkdir(this.mapsDir, { recursive: true });
    const filePath = join(this.mapsDir, `${profileName}.json`);
    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return { profileName, filePath };
  }

  async loadProfile(profileName) {
    if (!profileName) throw new Error('profileName is required');
    const filePath = join(this.mapsDir, `${profileName}.json`);
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async listProfiles() {
    await mkdir(this.mapsDir, { recursive: true });
    const entries = await readdir(this.mapsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name.replace(/\.json$/u, ''));
  }
}
