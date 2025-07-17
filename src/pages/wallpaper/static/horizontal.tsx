import React, { useRef, useState } from 'react';
import styles from '@/pages/wallpaper/static/index.module.less';
import { emitToSelf, emitWinReadyEvent, listenSelf } from '@/others/utils.ts';
import { Events } from '@/others/enums.ts';
import { useSettings } from '@/components/GlobalContext';
import { convertFileSrc } from '@tauri-apps/api/core';
import { HorizontalWallpaperEventArgs } from '@/others/types.ts';
import { EventCallback, UnlistenFn } from '@tauri-apps/api/event';
import { useMount, useUnmount } from 'ahooks';
import ImageWithTransition from '@/components/ImageWithTransition';

export const HorizontalStaticWallpaper: React.FC = () => {
  const settings = useSettings();

  const [path, setPath] = useState<string>();

  const firstImgLoadedRef = useRef(false);

  const unlistenFnListRef = useRef<UnlistenFn[]>([]);
  const wallpaperHandler: EventCallback<HorizontalWallpaperEventArgs> = ({
    payload,
  }) => {
    setPath(payload.path);
  };

  async function registerListeners() {
    unlistenFnListRef.current = [
      await listenSelf(Events.SetHoriStaticWallpaper, wallpaperHandler),
    ];
  }

  function unregisterListeners() {
    unlistenFnListRef.current.forEach((item) => item());
  }

  useMount(async () => {
    await registerListeners();

    await emitWinReadyEvent();
  });

  useUnmount(() => {
    unregisterListeners();
  });

  return (
    <div className={styles.horizontalWallpaperLayout}>
      {path ? (
        <ImageWithTransition
          className={styles.horizontalWallpaper}
          transitionDuration={1500}
          alt="wallpaper"
          path={convertFileSrc(path)}
          imgStyle={{
            objectFit: settings?.webScaleMode,
          }}
          onLoad={async () => {
            if (!firstImgLoadedRef.current) {
              await emitToSelf(Events.HoriStaticWallpaperLoaded);
              firstImgLoadedRef.current = true;
            }
          }}
        />
      ) : null}
    </div>
  );
};
