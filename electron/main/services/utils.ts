import { join } from 'node:path';
import { app } from 'electron';
import { mkdirSync } from 'node:fs';

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

try {
  mkdirSync(userDataDir, {
    recursive: true,
  });
} catch (e) {}

export function randomByRange(min: number, max: number) {
  const range = max - min;
  const randNum = Math.random();
  return min + Math.round(randNum * range);
}
