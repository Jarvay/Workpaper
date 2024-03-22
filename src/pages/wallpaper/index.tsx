import React, { useState } from 'react';
import { useMount, useUnmount } from 'ahooks';
import type { IpcRendererEvent } from 'electron';
import { ipcRenderer } from 'electron';
import { Events, WallpaperType } from '../../../cross/enums';
import { emitter } from '@/services/emitter';
import LiveWallpaper from '@/pages/wallpaper/components/LiveWallpaper';
import StaticWallpaper from '@/pages/wallpaper/components/StaticWallpaper';
import { useParams } from 'react-router-dom';

const Wallpaper: React.FC = () => {
  const [path, setPath] = useState<string>();
  const [wallpaperType, setWallpaperType] = useState<WallpaperType>();

  const { displayId } = useParams();

  const staticWallpaperHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, _path: string) => {
    setPath(_path);
    setWallpaperType(WallpaperType.Image);
  };

  function registerStaticWallpaperEvents() {
    ipcRenderer.on(Events.SetStaticWallpaper, staticWallpaperHandler);
  }

  function unregisterStaticWallpaperEvents() {
    ipcRenderer.off(Events.SetStaticWallpaper, staticWallpaperHandler);
  }

  useMount(() => {
    emitter.emit('setSettingsBtnShow', false);

    registerStaticWallpaperEvents();

    ipcRenderer.on(Events.SetStaticWallpaper, () => {
      setWallpaperType(WallpaperType.Image);
    });

    ipcRenderer.on(Events.SetLiveWallpaper, () => {
      setWallpaperType(WallpaperType.Video);
    });

    ipcRenderer.send(Events.WallpaperWinReady, Number(displayId));
  });

  useUnmount(() => {
    unregisterStaticWallpaperEvents();
  });

  return (
    <div style={{ position: 'relative' }}>
      <StaticWallpaper
        path={path}
        style={{
          display: wallpaperType === WallpaperType.Image ? undefined : 'none',
        }}
      />

      <LiveWallpaper
        style={{
          display: wallpaperType === WallpaperType.Video ? undefined : 'none',
        }}
      />
    </div>
  );
};

export default Wallpaper;
