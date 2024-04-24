import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { registerHandlers } from './handlers';
import './locale';
import { setTray } from './tray';
import { resetSchedule } from './services/wallpaper';
import { indexHtml, url } from './services/utils';
import {
  closeWallpaperWin,
  createWallpaperWin,
  detachWallpaperWin,
} from './services/wallpaper-window';
import { t as _t } from 'i18next';
import { TranslationFunc } from '../../cross/interface';
import { update } from './update';
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';
import { configServiceMain } from './services/db-service';
import { WallpaperMode } from '../../cross/enums';
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

const template: any[] = [
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
