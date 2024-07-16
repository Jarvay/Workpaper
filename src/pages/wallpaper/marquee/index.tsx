import React, { useState } from 'react';
import ReactFastMarquee from 'react-fast-marquee';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { MarqueeEventArg } from '../../../../cross/interface';
import { Events } from '../../../../cross/enums';
import { useMount, useUnmount } from 'ahooks';
import { useParams } from 'react-router-dom';
import styles from './index.module.less';

const Marquee: React.FC = () => {
  const [arg, setArg] = useState<MarqueeEventArg>();

  const { displayId } = useParams();

  const marqueeWallpaperHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, arg: any) => {
    setArg(arg);
  };

  function registerMarqueeWallpaperEvents() {
    ipcRenderer.on(Events.SetMarqueeWallpaper, marqueeWallpaperHandler);
  }

  function unregisterMarqueeWallpaperEvents() {
    ipcRenderer.off(Events.SetMarqueeWallpaper, marqueeWallpaperHandler);
  }

  useMount(async () => {
    ipcRenderer.send(Events.WallpaperWinReady, Number(displayId));

    registerMarqueeWallpaperEvents();
  });

  useUnmount(() => {
    unregisterMarqueeWallpaperEvents();
  });

  const marquee = arg?.marquee;
  if (!marquee) return null;

  return (
    <ReactFastMarquee
      speed={marquee.speed}
      className={styles.wallpaperContainer}
      onMount={() => {
        ipcRenderer.send(Events.MarqueeWallpaperLoaded, Number(displayId));
      }}
      style={{
        color: marquee.textColor?.toString(),
        backgroundColor: marquee?.backgroundColor?.toString(),
        fontSize: marquee.fontSize ? `${marquee.fontSize}px` : undefined,
        letterSpacing: marquee.letterSpacing
          ? `${marquee.letterSpacing}px`
          : undefined,
      }}
    >
      {marquee.text}
    </ReactFastMarquee>
  );
};

export default Marquee;
