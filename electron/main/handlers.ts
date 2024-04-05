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
  Rule,
  Settings,
  TranslationFunc,
  Weekday,
} from '../../cross/interface';
import { resetSchedule } from './services/wallpaper';
import { IMAGE_EXT_LIST, VIDEO_EXT_LIST } from '../../cross/consts';
import { platform } from 'os';
import { t as _t, changeLanguage } from 'i18next';
import { configServiceMain } from './services/db-service';
import { setLiveWallpaperVolume } from './services/wallpaper-window';
import { setTray } from './tray';

const t = _t as TranslationFunc;

export function registerHandlers(createWindow: () => Promise<BrowserWindow>) {
  ipcMain.handle(Events.SelectImage, () => {
    return dialog.showOpenDialogSync({
      filters: [
        { name: t('rule.wallpaperType.image'), extensions: IMAGE_EXT_LIST },
      ],
      properties: ['openFile'],
    });
  });

  ipcMain.handle(Events.SelectVideo, () => {
    return dialog.showOpenDialogSync({
      filters: [
        { name: t('rule.wallpaperType.video'), extensions: VIDEO_EXT_LIST },
      ],
      properties: ['openFile'],
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

  ipcMain.handle(Events.SaveRules, (event, rules: Rule[]) => {
    configServiceMain.setItem('rules', rules);
  });

  ipcMain.handle(Events.SaveWeekdays, (event, weekdays: Weekday[]) => {
    configServiceMain.setItem('weekdays', weekdays);
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
    setLiveWallpaperVolume(volume);
  });

  ipcMain.handle(Events.GetVersion, () => {
    return app.getVersion();
  });

  ipcMain.handle(Events.OpenExternal, (_, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle(Events.IsPackaged, () => {
    return app.isPackaged;
  });

  powerMonitor.on('resume', async () => {
    await resetSchedule();
  });
}
