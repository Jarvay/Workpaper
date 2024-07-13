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
import { getDarwinStatusBarHeight, indexHtml, url } from './utils';
import { Subject } from 'rxjs';
import { omit } from 'lodash';
import {
  LiveWallpaperEventArg,
  MarqueeEventArg,
  StaticWallpaperEventArg,
  WebpageEventArg,
} from '../../../cross/interface';

type WallpaperWinType = WallpaperType | 'Marquee' | 'Webpage';

const DEBUG = !app.isPackaged && false;

const defaultWinOptions: Electron.BrowserWindowConstructorOptions = {
  autoHideMenuBar: !DEBUG,
  frame: DEBUG,
  focusable: DEBUG,
  resizable: DEBUG,
  show: !DEBUG,
  opacity: DEBUG ? 1 : 0,
  webPreferences: {
    nodeIntegration: true,
    webSecurity: false,
    contextIsolation: false,
  },
};

const subject = new Subject<BrowserWindow>();

export type WallpaperWindowConstructorOptions = {
  resetSchedule: () => Promise<void>;
  removeSchedule: () => Promise<void>;
};

export class WallpaperWindowService {
  resetSchedule: WallpaperWindowConstructorOptions['resetSchedule'];

  windowsMap: Map<number, BrowserWindow> = new Map();

  isPaused = false;

  public static instance: WallpaperWindowService;

  public static init(opts: WallpaperWindowConstructorOptions) {
    WallpaperWindowService.instance = new WallpaperWindowService(opts);
  }

  private constructor(opts: WallpaperWindowConstructorOptions) {
    this.resetSchedule = opts.resetSchedule;
  }

  private async checkDisplayWin(displayId: number) {
    const win = this.windowsMap.get(displayId);
    if (win?.isDestroyed()) {
      this.windowsMap.clear();
      await this.resetSchedule();
      return false;
    }

    return true;
  }

  private async loadUrl(
    win: BrowserWindow,
    displayId: number,
    wallpaperType: WallpaperWinType,
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
      case 'Marquee':
        path = '#/wallpaper/marquee';
        break;
      case 'Webpage':
        break;
    }

    path = `${host}${path}/${displayId}`;

    if (path) {
      await win.loadURL(path);
    }
  }

  private async createWindows(
    displayId: number,
    wallpaperType: WallpaperWinType,
    winOptions: (bounds: Rectangle) => BrowserWindowConstructorOptions,
  ) {
    if (this.windowsMap.size === screen.getAllDisplays().length) {
      return;
    }

    const display = screen
      .getAllDisplays()
      .find((item) => item.id === displayId) as Display;
    const childWin = new BrowserWindow({
      ...winOptions(display.bounds),
    });
    this.windowsMap.set(display.id, childWin);

    childWin.setIgnoreMouseEvents(true);

    if (DEBUG && !app.isPackaged) {
      childWin.webContents.openDevTools();
      childWin.setFocusable(true);
      childWin.setIgnoreMouseEvents(false);
      childWin.setResizable(true);
      childWin.setFocusable(true);
    }

    return childWin;
  }

  private async createDarwinWin(
    displayId: number,
    wallpaperType: WallpaperWinType,
  ) {
    return await this.createWindows(
      displayId,
      wallpaperType,
      ({ width, height, x, y }) => {
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
        };
      },
    );
  }

  private async createWin32Win(
    displayId: number,
    wallpaperType: WallpaperWinType,
  ) {
    return await this.createWindows(
      displayId,
      wallpaperType,
      ({ width, height, x, y }) => {
        return {
          ...defaultWinOptions,
          skipTaskbar: true,
          transparent: true,
          x: x - 4,
          y: y - 2,
          width: width + 8,
          height: height + 4,
        };
      },
    );
  }

  private async createLinuxWin(
    displayId: number,
    wallpaperType: WallpaperWinType,
  ) {
    return await this.createWindows(
      displayId,
      wallpaperType,
      ({ width, height }) => {
        return {
          ...omit(defaultWinOptions, ['frame', 'focusable', 'resizable']),
          type: 'desktop',
          width: width,
          height: height,
          transparent: true,
        };
      },
    );
  }

  private createWallpaperWin(
    displayId: number,
    wallpaperType: WallpaperWinType,
  ) {
    if (platform() === 'darwin') {
      return this.createDarwinWin(displayId, wallpaperType);
    } else if (platform() === 'win32') {
      return this.createWin32Win(displayId, wallpaperType);
    } else if (platform() === 'linux') {
      return this.createLinuxWin(displayId, wallpaperType);
    }
  }

  async setLiveWallpaper(arg: LiveWallpaperEventArg, displayId: number) {
    if (!(await this.checkDisplayWin(displayId))) return;

    arg.paths = arg.paths.map((path) => {
      if (!path.startsWith('file://')) {
        return `file://${path}`;
      }
      return path;
    });

    subject.subscribe({
      next: (value) => {
        const win = this.windowsMap.get(displayId);
        if (win === value) {
          value?.webContents.send(Events.SetLiveWallpaper, arg);
        }
      },
    });

    this.windowsMap.forEach((item, dId) => {
      if (displayId === dId) {
        item.webContents.send(Events.SetLiveWallpaper, arg);
      }
    });

    const win = await this.createWallpaperWin(displayId, WallpaperType.Video);
    if (win) {
      await this.loadUrl(win, displayId, WallpaperType.Video);
    }
  }

  async setStaticWallpaper(arg: StaticWallpaperEventArg, displayId: number) {
    if (!(await this.checkDisplayWin(displayId))) return;

    subject.subscribe({
      next: (value) => {
        const win = this.windowsMap.get(displayId);
        if (win === value) {
          value?.webContents.send(Events.SetStaticWallpaper, arg);
        }
      },
    });

    this.windowsMap.forEach((item, dId) => {
      if (displayId === dId) {
        item.webContents.send(Events.SetStaticWallpaper, arg);
      }
    });

    const win = await this.createWallpaperWin(displayId, WallpaperType.Image);
    if (win) {
      await this.loadUrl(win, displayId, WallpaperType.Image);
    }
  }

  async setMarqueeWallpaper(arg: MarqueeEventArg, displayId: number) {
    if (!(await this.checkDisplayWin(displayId))) return;

    subject.subscribe({
      next: (value) => {
        const win = this.windowsMap.get(displayId);
        if (win === value) {
          value?.webContents.send(Events.SetMarqueeWallpaper, arg);
        }
      },
    });

    this.windowsMap.forEach((item, dId) => {
      if (displayId === dId) {
        item.webContents.send(Events.SetMarqueeWallpaper, arg);
      }
    });

    const win = await this.createWallpaperWin(displayId, 'Marquee');
    if (win) {
      await this.loadUrl(win, displayId, 'Marquee');
    }
  }

  async setWebpageWallpaper(arg: WebpageEventArg, displayId: number) {
    if (!(await this.checkDisplayWin(displayId))) return;

    const win = await this.createWallpaperWin(displayId, 'Webpage');
    if (!win) return;
    const position = win.getPosition();
    win.setPosition(position[0], getDarwinStatusBarHeight() - 3);
    const size = win.getSize();
    win.setSize(size[0], size[1] - getDarwinStatusBarHeight());
    win.webContents.on('did-finish-load', () => {
      win.setOpacity(1);
      win.show();
    });
    await win.loadURL(arg.webpage.url);
  }

  detachWallpaperWin() {
    this.windowsMap.forEach((win) => {
      if (platform() === 'win32') {
        const { detach } = require('electron-as-wallpaper');
        detach(win);
      }
      win.hide();
    });
    this.windowsMap.clear();
  }

  closeWallpaperWin() {
    this.windowsMap.forEach((win) => {
      win.close();
      win.destroy();
      if (platform() === 'win32') {
        const { refresh } = require('electron-as-wallpaper');
        refresh();
      }
    });
    this.windowsMap.clear();
  }

  setLiveWallpaperMuted(muted: boolean) {
    this.windowsMap.forEach((win) => {
      win?.webContents.send(Events.SetLiveWallpaperMuted, muted);
    });
  }

  setLiveWallpaperVolume(volume: number) {
    this.windowsMap.forEach((win) => {
      win.webContents.send(Events.SetLiveWallpaperVolume, volume);
    });
  }

  registerWallpaperWinHandler() {
    const loadedListener: (event: IpcMainEvent, ...args: any[]) => void = (
      _,
      displayId: number,
    ) => {
      const win = this.windowsMap.get(displayId) as BrowserWindow;
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
      }, 500);
    };

    ipcMain.on(Events.StaticWallpaperLoaded, loadedListener);
    ipcMain.on(Events.LiveWallpaperLoaded, loadedListener);
    ipcMain.on(Events.MarqueeWallpaperLoaded, loadedListener);

    ipcMain.on(Events.WallpaperWinReady, (_, displayId) => {
      subject.next(this.windowsMap.get(displayId) as BrowserWindow);
    });
  }

  public toggleLiveWallpaper() {
    if (this.isPaused) {
      this.isPaused = !this.isPaused;
      this.windowsMap.forEach((win) => {
        win.webContents.send(Events.PlayLiveWallpaper);
      });
    } else {
      this.isPaused = !this.isPaused;
      this.windowsMap.forEach((win) => {
        win.webContents.send(Events.PauseLiveWallpaper);
      });
    }
  }
}
