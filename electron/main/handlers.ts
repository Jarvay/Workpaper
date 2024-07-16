import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  powerMonitor,
  shell,
} from 'electron';
import { Events } from '../../cross/enums';
import {
  AlbumFileListItem,
  Rule,
  Settings,
  ToAlbumFileListItemParams,
  Weekday,
} from '../../cross/interface';
import { resetSchedule } from './services/wallpaper';
import { IMAGE_EXT_LIST, VIDEO_EXT_LIST } from '../../cross/consts';
import { platform } from 'os';
import { changeLanguage, t } from 'i18next';
import { configServiceMain } from './services/config.service';
import { createThumb } from './services/utils';
import { WallpaperWindowService } from './services/wallpaper-window';
import { setTray } from './tray';
import {
  registerShortcut,
  unregisterShortcut,
} from './services/global-shortcut';

export function registerHandlers(createWindow: () => Promise<BrowserWindow>) {
  ipcMain.handle(Events.SelectImage, (_, args) => {
    return dialog.showOpenDialogSync({
      filters: [
        { name: t('rule.wallpaperType.image'), extensions: IMAGE_EXT_LIST },
      ],
      properties: ['openFile', ...(args || [])],
    });
  });

  ipcMain.handle(Events.SelectVideo, (_, args) => {
    return dialog.showOpenDialogSync({
      filters: [
        { name: t('rule.wallpaperType.video'), extensions: VIDEO_EXT_LIST },
      ],
      properties: ['openFile', ...(args || [])],
    });
  });

  ipcMain.handle(Events.SelectDir, () => {
    return dialog.showOpenDialogSync({
      properties: ['openDirectory'],
    });
  });

  ipcMain.handle(Events.ResetSchedule, async (event) => {
    await resetSchedule();
  });

  ipcMain.handle(Events.GetLocale, () => {
    return app.getLocale();
  });

  ipcMain.handle(Events.GetPlatform, () => {
    return platform();
  });

  ipcMain.handle(Events.SettingsChange, async (_, settings: Settings) => {
    const oldSettings = configServiceMain.getItem('settings');
    configServiceMain.setItem('settings', settings);
    if (settings.locale !== oldSettings.locale) {
      await changeLanguage(settings.locale);
      setTray(process.env.VITE_PUBLIC, createWindow);
    }
    if (settings.scaleMode !== oldSettings.scaleMode) {
      await resetSchedule();
    }

    if (settings.pausePlayShortcut !== oldSettings.pausePlayShortcut) {
      unregisterShortcut([oldSettings.pausePlayShortcut]);
      registerShortcut();
    }
  });

  ipcMain.handle(Events.InitSettings, (_, settings: Settings) => {
    configServiceMain.setItem('settings', settings);
  });

  ipcMain.handle(Events.SetDBItem, (_, ...args) => {
    const [key, data] = args;
    configServiceMain.setItem(key, data);
  });

  ipcMain.handle(Events.GetDBItem, (_, key) => {
    return configServiceMain.getItem(key);
  });

  ipcMain.handle(Events.SetLiveWallpaperVolume, (_, volume) => {
    WallpaperWindowService.instance.setLiveWallpaperVolume(volume);
  });

  ipcMain.handle(Events.GetVersion, () => {
    return app.getVersion();
  });

  ipcMain.handle(Events.OpenExternal, (_, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle(Events.OpenPath, async (_, path) => {
    await shell.openPath(path);
  });

  ipcMain.handle(Events.IsPackaged, () => {
    return app.isPackaged;
  });

  ipcMain.handle(
    Events.ToAlbumListItem,
    async (_, params: ToAlbumFileListItemParams) => {
      const result: AlbumFileListItem[] = [];

      for (const path of params.files) {
        const thumb = await createThumb(path, params.width, params.quality);
        result.push({
          path,
          thumb,
        });
      }

      return result;
    },
  );

  ipcMain.handle(Events.UnregisterGlobalShortcut, () => {
    const settings = configServiceMain.getItem('settings');
    unregisterShortcut([settings.pausePlayShortcut]);
  });

  ipcMain.handle(Events.OpenWindow, (event, url: string) => {
    const win = new BrowserWindow({
      focusable: true,
      resizable: true,
      show: true,
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false,
        contextIsolation: false,
      },
    });

    win.loadURL(url);
    win.maximize();
  });

  powerMonitor.on('resume', async () => {
    await resetSchedule();
  });

  WallpaperWindowService.instance.registerWallpaperWinHandler();
}
