import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Loads the profile document from disk. This file is the source of truth used
 * to seed MongoDB and to keep the site readable when the database is offline.
 */
export async function loadProfileFile() {
  const raw = await fs.readFile(path.join(DATA_DIR, 'profile.json'), 'utf8');
  return JSON.parse(raw);
}
