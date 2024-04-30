import { platform } from 'os';
import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  NativeImage,
} from 'electron';
import { join } from 'node:path';
import { t as _t } from 'i18next';
import { TranslationFunc } from '../../cross/interface';
import { configServiceMain } from './services/db-service';
import { setLiveWallpaperMuted } from './services/wallpaper-window';

const t: TranslationFunc = _t;

let tray: Tray;

enum TrayMenuItem {
  OpenAtLogin = 1,
  Muted = 2,
  AutoCheckUpdate = 4,
}

export function setTray(
  publicDir: string,
  createWindow: () => Promise<BrowserWindow>,
) {
  let trayIcon: string | NativeImage =
    platform() === 'win32' ? 'favicon.ico' : 'faviconTemplate.png';
  trayIcon = join(publicDir, trayIcon);

  if (platform() === 'darwin') {
    trayIcon = nativeImage.createFromPath(trayIcon);
    trayIcon.setTemplateImage(true);
    trayIcon = trayIcon.resize({
      width: 22,
      height: 22,
    });
  }

  if (!tray) {
    tray = new Tray(trayIcon);
  }

  tray.on('double-click', () => {
    createWindow();
  });

  const openAtLogin = configServiceMain.getItem('settings').openAtLogin;
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin,
    });
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('showWindow'),
      type: 'normal',
      click: () => {
        createWindow();
      },
    },
    {
      label: t('startAtLogin'),
      type: 'checkbox',
      checked: openAtLogin,
      click: () => {
        if (app.isPackaged) {
          const newOpenAtLogin =
            !configServiceMain.getItem('settings').openAtLogin;
          app.setLoginItemSettings({
            openAtLogin: newOpenAtLogin,
          });
          contextMenu.items[TrayMenuItem.OpenAtLogin].checked = newOpenAtLogin;
          tray?.setContextMenu(contextMenu);
          configServiceMain.setItem('settings', {
            ...configServiceMain.getItem('settings'),
            openAtLogin: newOpenAtLogin,
          });
        }
      },
    },
    {
      label: t('settings.mute'),
      type: 'checkbox',
      checked: configServiceMain.getItem('settings').muted,
      click: () => {
        const muted = !configServiceMain.getItem('settings').muted;
        contextMenu.items[TrayMenuItem.Muted].checked = muted;
        tray?.setContextMenu(contextMenu);
        setLiveWallpaperMuted(muted);
        configServiceMain.setItem('settings', {
          ...configServiceMain.getItem('settings'),
          muted,
        });
      },
    },
    {
      label: t('autoCheckUpdate'),
      type: 'checkbox',
      checked: configServiceMain.getItem('settings').autoCheckUpdate,
      click: () => {
        const autoCheckUpdate =
          !configServiceMain.getItem('settings').autoCheckUpdate;
        contextMenu.items[TrayMenuItem.AutoCheckUpdate].checked =
          autoCheckUpdate;
        tray?.setContextMenu(contextMenu);
        setLiveWallpaperMuted(autoCheckUpdate);
        configServiceMain.setItem('settings', {
          ...configServiceMain.getItem('settings'),
          autoCheckUpdate,
        });
      },
    },
    {
      label: t('exit'),
      type: 'normal',
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  return tray;
}
