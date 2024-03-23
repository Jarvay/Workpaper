import {
  BrowserWindow,
  ipcMain,
  screen,
  IpcMainEvent,
  BrowserWindowConstructorOptions,
  Rectangle,
  Display,
  app,
} from 'electron';
import { platform } from 'os';
import { Events } from '../../../cross/enums';
import { indexHtml, url } from './utils';
import { Subject } from 'rxjs';
import { omit } from 'lodash';

const DEBUG = false;

const windowsMap: Map<number, BrowserWindow> = new Map();

const defaultWinOptions: Electron.BrowserWindowConstructorOptions = {
  autoHideMenuBar: true,
  frame: false,
  focusable: false,
  resizable: false,
  show: false,
  webPreferences: {
    nodeIntegration: true,
    webSecurity: false,
    contextIsolation: false,
  },
};

const subject = new Subject<BrowserWindow>();

function loadUrl(win: BrowserWindow, displayId: number) {
  let pageUrl = '';
  if (url) {
    pageUrl = `${url}#/wallpaper/${displayId}`;
  } else {
    pageUrl = `file://${indexHtml}#/wallpaper/${displayId}`;
  }

  return win.loadURL(pageUrl);
}

async function createWindows(
  displayId: number,
  winOptions: (bounds: Rectangle) => BrowserWindowConstructorOptions,
) {
  if (windowsMap.size === screen.getAllDisplays().length) {
    return;
  }
  const displays = screen.getAllDisplays();

  const loadedDisplayIdSet: Set<number> = new Set();
  const loadedListener: (event: IpcMainEvent, ...args: any[]) => void = (
    _,
    displayId: number,
  ) => {
    if (loadedDisplayIdSet.size === displays.length) {
      ipcMain.off(Events.StaticWallpaperLoaded, loadedListener);
      ipcMain.off(Events.LiveWallpaperLoaded, loadedListener);
      return;
    }
    const win = windowsMap.get(displayId) as BrowserWindow;

    if (platform() === 'win32') {
      if (!DEBUG || app.isPackaged) {
        win.maximize();
        const { attach } = require('electron-as-wallpaper');
        attach(win);
      }
    }
    if (platform() === 'linux') {
      win.maximize();
    }
    setTimeout(() => {
      win.setOpacity(1);
    }, 600);
    loadedDisplayIdSet.add(displayId);
  };

  ipcMain.on(Events.StaticWallpaperLoaded, loadedListener);
  ipcMain.on(Events.LiveWallpaperLoaded, loadedListener);

  ipcMain.on(Events.WallpaperWinReady, (_, displayId) => {
    subject.next(windowsMap.get(displayId) as BrowserWindow);
  });

  const display = screen
    .getAllDisplays()
    .find((item) => item.id === displayId) as Display;
  const childWin = new BrowserWindow({
    ...winOptions(display.bounds),
  });
  windowsMap.set(display.id, childWin);

  childWin.setIgnoreMouseEvents(true);

  if (DEBUG && !app.isPackaged) {
    childWin.webContents.openDevTools();
    childWin.setFocusable(true);
    childWin.setIgnoreMouseEvents(false);
    childWin.setResizable(true);
    childWin.setFocusable(true);
  }
  await loadUrl(childWin, display.id);
}

async function createDarwinWin(displayId: number) {
  await createWindows(displayId, ({ width, height, x, y }) => {
    return {
      ...defaultWinOptions,
      fullscreen: false,
      type: 'desktop',
      x: x - 4,
      y: y - 2,
      width: width + 8,
      height: height + 4,
      enableLargerThanScreen: true,
      opacity: 0,
      transparent: true,
      show: true,
    };
  });
}

async function createWin32Win(displayId: number) {
  await createWindows(displayId, ({ width, height, x, y }) => {
    return {
      ...defaultWinOptions,
      skipTaskbar: true,
      show: true,
      opacity: 0,
      transparent: true,
      x: x - 4,
      y: y - 2,
      width: width + 8,
      height: height + 4,
    };
  });
}

async function createLinuxWin(displayId: number) {
  await createWindows(displayId, ({ width, height }) => {
    return {
      ...omit(defaultWinOptions, ['frame', 'focusable', 'resizable']),
      type: 'desktop',
      width: width,
      height: height,
      opacity: 0,
      transparent: true,
      show: true,
    };
  });
}

export function createWallpaperWin(displayId: number) {
  if (platform() === 'darwin') {
    return createDarwinWin(displayId);
  } else if (platform() === 'win32') {
    return createWin32Win(displayId);
  } else if (platform() === 'linux') {
    return createLinuxWin(displayId);
  }
}

export function setLiveWallpaper(paths: string[], displayId: number) {
  paths = paths.map((path) => {
    if (!path.startsWith('file://')) {
      return `file://${path}`;
    }
    return path;
  });

  subject.subscribe({
    next: (value) => {
      const win = windowsMap.get(displayId);
      if (win === value) {
        value?.webContents.send(Events.SetLiveWallpaper, paths);
      }
    },
  });

  windowsMap.forEach((win, dId) => {
    if (displayId === dId) {
      win.webContents.send(Events.SetLiveWallpaper, paths);
    }
  });

  return createWallpaperWin(displayId);
}

export function setStaticWallpaper(path: string, displayId: number) {
  subject.subscribe({
    next: (value) => {
      const win = windowsMap.get(displayId);
      if (win === value) {
        value?.webContents.send(Events.SetStaticWallpaper, path);
      }
    },
  });

  windowsMap.forEach((win, dId) => {
    if (displayId === dId) {
      win.webContents.send(Events.SetStaticWallpaper, path);
    }
  });

  return createWallpaperWin(displayId);
}

export function detachWallpaperWin() {
  windowsMap.forEach((win) => {
    if (platform() === 'win32') {
      const { detach } = require('electron-as-wallpaper');
      detach(win);
    }
    win.hide();
  });
}

export function closeWallpaperWin() {
  windowsMap.forEach((win) => {
    win.close();
    win.destroy();
    if (platform() === 'win32') {
      const { refresh } = require('electron-as-wallpaper');
      refresh();
    }
  });
}

export function setLiveWallpaperMuted(muted: boolean) {
  windowsMap.forEach((win) => {
    win?.webContents.send(Events.SetLiveWallpaperMuted, muted);
  });
}

export function setLiveWallpaperVolume(volume: number) {
  windowsMap.forEach((win) => {
    win.webContents.send(Events.SetLiveWallpaperVolume, volume);
  });
}
