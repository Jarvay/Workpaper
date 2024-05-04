import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Display,
  ipcMain,
  IpcMainEvent,
  Rectangle,
  screen,
} from 'electron';
import { platform } from 'os';
import { Events, WallpaperType } from '../../../cross/enums';
import { indexHtml, url } from './utils';
import { Subject } from 'rxjs';
import { omit } from 'lodash';
import { StaticWallpaperEventArg } from '../../../cross/interface';

const DEBUG = !app.isPackaged && true;

const windowsMap: Map<number, BrowserWindow> = new Map();

const defaultWinOptions: Electron.BrowserWindowConstructorOptions = {
  autoHideMenuBar: !DEBUG,
  frame: DEBUG,
  focusable: DEBUG,
  resizable: DEBUG,
  show: false,
  opacity: DEBUG ? 1 : 0,
  webPreferences: {
    nodeIntegration: true,
    webSecurity: false,
    contextIsolation: false,
  },
};

const subject = new Subject<BrowserWindow>();

function loadUrl(
  win: BrowserWindow,
  displayId: number,
  wallpaperType: WallpaperType,
) {
  const host = url || `file://${indexHtml}`;

  let path = '';
  switch (wallpaperType) {
    case WallpaperType.Video:
      path = '#/wallpaper/live';
      break;
    case WallpaperType.Image:
      path = '#/wallpaper/static';
      break;
  }

  path = `${host}${path}/${displayId}`;

  return win.loadURL(path);
}

async function createWindows(
  displayId: number,
  wallpaperType: WallpaperType,
  winOptions: (bounds: Rectangle) => BrowserWindowConstructorOptions,
) {
  if (windowsMap.size === screen.getAllDisplays().length) {
    return;
  }

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
  await loadUrl(childWin, display.id, wallpaperType);
}

async function createDarwinWin(
  displayId: number,
  wallpaperType: WallpaperType,
) {
  await createWindows(displayId, wallpaperType, ({ width, height, x, y }) => {
    return {
      ...defaultWinOptions,
      fullscreen: false,
      type: DEBUG ? undefined : 'desktop',
      x: x - 4,
      y: y - 2,
      width: width + 8,
      height: height + 4,
      enableLargerThanScreen: !DEBUG,
      transparent: !DEBUG,
      show: true,
    };
  });
}

async function createWin32Win(displayId: number, wallpaperType: WallpaperType) {
  await createWindows(displayId, wallpaperType, ({ width, height, x, y }) => {
    return {
      ...defaultWinOptions,
      skipTaskbar: true,
      show: true,
      transparent: true,
      x: x - 4,
      y: y - 2,
      width: width + 8,
      height: height + 4,
    };
  });
}

async function createLinuxWin(displayId: number, wallpaperType: WallpaperType) {
  await createWindows(displayId, wallpaperType, ({ width, height }) => {
    return {
      ...omit(defaultWinOptions, ['frame', 'focusable', 'resizable']),
      type: 'desktop',
      width: width,
      height: height,
      transparent: true,
      show: true,
    };
  });
}

export function createWallpaperWin(
  displayId: number,
  wallpaperType: WallpaperType,
) {
  if (platform() === 'darwin') {
    return createDarwinWin(displayId, wallpaperType);
  } else if (platform() === 'win32') {
    return createWin32Win(displayId, wallpaperType);
  } else if (platform() === 'linux') {
    return createLinuxWin(displayId, wallpaperType);
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

  return createWallpaperWin(displayId, WallpaperType.Video);
}

export function setStaticWallpaper(
  arg: StaticWallpaperEventArg,
  displayId: number,
) {
  subject.subscribe({
    next: (value) => {
      const win = windowsMap.get(displayId);
      if (win === value) {
        value?.webContents.send(Events.SetStaticWallpaper, arg);
      }
    },
  });

  windowsMap.forEach((win, dId) => {
    if (displayId === dId) {
      win.webContents.send(Events.SetStaticWallpaper, arg);
    }
  });

  return createWallpaperWin(displayId, WallpaperType.Image);
}

export function detachWallpaperWin() {
  windowsMap.forEach((win) => {
    if (platform() === 'win32') {
      const { detach } = require('electron-as-wallpaper');
      detach(win);
    }
    win.hide();
  });
  windowsMap.clear();
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
  windowsMap.clear();
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

export function registerWallpaperWinHandler() {
  const loadedListener: (event: IpcMainEvent, ...args: any[]) => void = (
    _,
    displayId: number,
  ) => {
    const win = windowsMap.get(displayId) as BrowserWindow;
    if (win.getOpacity() === 1) {
      return;
    }

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
  };

  ipcMain.on(Events.StaticWallpaperLoaded, loadedListener);
  ipcMain.on(Events.LiveWallpaperLoaded, loadedListener);

  ipcMain.on(Events.WallpaperWinReady, (_, displayId) => {
    subject.next(windowsMap.get(displayId) as BrowserWindow);
  });
}
