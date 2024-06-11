import { platform } from 'os';
import { BrowserWindow } from 'electron';
import { Events } from '../../../cross/enums';
import { configServiceMain } from './config.service';
import { WallpaperWindowService } from './wallpaper-window';

interface CheckTimerParams {
  win: BrowserWindow;
  winHandle: number;
}

let timer: NodeJS.Timeout;
async function checkTimer(params: CheckTimerParams) {
  const { win, winHandle } = params;

  timer = setTimeout(async () => {
    if (WallpaperWindowService.instance.isPaused) {
      clearTimeout(timer);
      return;
    }

    const { isWindowCompletedCovered } = require('@jarvay/workpaper-library');

    const shouldPause = isWindowCompletedCovered(winHandle);

    if (shouldPause) {
      win.webContents.send(Events.PauseLiveWallpaper);
    } else {
      win.webContents.send(Events.PlayLiveWallpaper);
    }

    await checkTimer(params);
  }, 500);
}

export async function startCheckTimer(win: BrowserWindow) {
  if (platform() !== 'win32') return;

  const settings = configServiceMain.getItem('settings');
  if (!settings.pauseWhenBlur) return;

  const winHandle = win.getNativeWindowHandle().readUInt32LE(0);
  await checkTimer({
    win,
    winHandle,
  });
}
