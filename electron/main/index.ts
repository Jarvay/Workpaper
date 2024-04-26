import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  MenuItem,
  MenuItemConstructorOptions,
} from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { registerHandlers } from './handlers';
import './locale';
import { setTray } from './tray';
import { resetSchedule } from './services/wallpaper';
import { indexHtml, url } from './services/utils';
import {
  closeWallpaperWin,
  detachWallpaperWin,
} from './services/wallpaper-window';
import { t as _t } from 'i18next';
import { TranslationFunc } from '../../cross/interface';
import { update } from './update';
import { handleDownload } from './services/download';
import { runMigrations } from './services/migration';

const t: TranslationFunc = _t;

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');

const template: MenuItemConstructorOptions[] = [
  {
    label: t('help'),
    role: 'help',
    submenu: [
      {
        label: 'Github',
        click: function () {
          shell.openExternal('https://github.com/Jarvay');
        },
      },
      {
        label: t('debug'),
        click: function () {
          if (win !== null) win.webContents.openDevTools();
        },
      },
    ],
  },
  {
    label: t('edit'),
    submenu: [
      {
        label: t('appMenu.edit.cut'),
        accelerator: 'CmdOrCtrl+X',
        // @ts-ignore
        selector: 'cut:',
      },
      {
        label: t('appMenu.edit.copy'),
        accelerator: 'CmdOrCtrl+C',
        // @ts-ignore
        selector: 'copy:',
      },
      {
        label: t('appMenu.edit.paste'),
        accelerator: 'CmdOrCtrl+V',
        // @ts-ignore
        selector: 'paste:',
      },
      {
        label: t('appMenu.edit.selectAll'),
        accelerator: 'CmdOrCtrl+A',
        // @ts-ignore
        selector: 'selectAll:',
      },
      {
        label: t('appMenu.edit.undo'),
        accelerator: 'CmdOrCtrl+Z',
        // @ts-ignore
        selector: 'undo:',
      },
    ],
  },
];

async function createWindow() {
  if (win) {
    return win;
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
    maximizable: true,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  win.on('closed', () => {
    win = null;
  });

  win.on('show', () => {
    handleDownload(win);
  });

  if (url) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  win.maximize();

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {});

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Apply electron-updater
  update(win);

  return win;
}

app.whenReady().then(async () => {
  await runMigrations();

  registerHandlers(createWindow);

  setTray(process.env.VITE_PUBLIC, createWindow);

  await resetSchedule();
});

app.on('window-all-closed', () => {
  win = null;
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

app.on('before-quit', () => {
  detachWallpaperWin();
  closeWallpaperWin();
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
