import React, { useState } from 'react';
import ReactFastMarquee from 'react-fast-marquee';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { MarqueeEventArg, WebpageEventArg } from '../../../../cross/interface';
import { Events } from '../../../../cross/enums';
import { useMount, useUnmount } from 'ahooks';
import { useParams } from 'react-router-dom';
import styles from './index.module.less';

const Webpage: React.FC = () => {
  const [arg, setArg] = useState<WebpageEventArg>();

  const { displayId } = useParams();

  const webpageWallpaperHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, arg: any) => {
    setArg(arg);
  };

  function registerWebpageWallpaperEvents() {
    ipcRenderer.on(Events.SetWebpageWallpaper, webpageWallpaperHandler);
  }

  function unregisterWebpageWallpaperEvents() {
    ipcRenderer.off(Events.SetWebpageWallpaper, webpageWallpaperHandler);
  }

  useMount(async () => {
    ipcRenderer.send(Events.WallpaperWinReady, Number(displayId));

    registerWebpageWallpaperEvents();
  });

  useUnmount(() => {
    unregisterWebpageWallpaperEvents();
  });

  return <iframe />;
};

export default Webpage;
