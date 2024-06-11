import { globalShortcut } from 'electron';
import { configServiceMain } from './config.service';
import { WallpaperWindowService } from './wallpaper-window';

export function registerShortcut(): void {
  const settings = configServiceMain.getItem('settings');

  if (!settings.pausePlayShortcut) return;

  globalShortcut.register(settings.pausePlayShortcut, () => {
    WallpaperWindowService.instance.toggleLiveWallpaper();
  });
}

export function unregisterShortcut(shortcuts: string[]): void {
  shortcuts.forEach((shortcut) => {
    globalShortcut.unregister(shortcut);
  });
}
