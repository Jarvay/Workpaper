import { join } from 'node:path';
import { app } from 'electron';
import { mkdirSync } from 'node:fs';
import { createHash } from 'crypto';

process.env.DIST_ELECTRON = join(__dirname, '../');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

export const url = process.env.VITE_DEV_SERVER_URL;
export const indexHtml = join(process.env.DIST, 'index.html');

const userDataParentDir = !app.isPackaged
  ? app.getAppPath()
  : app.getPath('userData');
export const userDataDir = join(userDataParentDir, 'userData');

const THUMBS_DIR = join(userDataDir, 'thumbs');

try {
  mkdirSync(userDataDir, {
    recursive: true,
  });
  mkdirSync(THUMBS_DIR, {
    recursive: true,
  });
} catch (e) {}

export async function createThumb(
  path: string,
  width: number,
  quality: number,
) {
  const sharp = require('sharp');
  const filename = createHash('md5').update(path).digest('hex') + '.jpg';
  const thumb = join(THUMBS_DIR, filename);
  await sharp(path)
    .resize(width)
    .jpeg({
      quality,
    })
    .toFile(thumb);

  return thumb;
}
