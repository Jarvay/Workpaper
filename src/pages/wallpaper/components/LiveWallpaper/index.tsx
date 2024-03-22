import React, { LegacyRef, useRef, useState } from 'react';
import { ipcRenderer, type IpcRendererEvent } from 'electron';
import { Events, WallpaperType } from '../../../../../cross/enums';
import { useParams } from 'react-router-dom';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import styles from './index.module.less';

export interface LiveWallpaperProps {
  style?: React.CSSProperties;
}

const LiveWallpaper: React.FC<LiveWallpaperProps> = (props) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const { displayId } = useParams();

  const videoRef = useRef<HTMLVideoElement>();

  const liveWallpaperHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, _paths: string[]) => {
    setPaths(_paths);
    setCurrentIndex(0);
  };

  const liveWallpaperMutedHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, muted: boolean) => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  };

  const liveWallpaperVolumeHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  };

  function registerLiveWallpaperEvents() {
    ipcRenderer.on(Events.SetLiveWallpaper, liveWallpaperHandler);

    ipcRenderer.on(Events.SetLiveWallpaperMuted, liveWallpaperMutedHandler);

    ipcRenderer.on(Events.SetLiveWallpaperVolume, liveWallpaperVolumeHandler);
  }

  function unregisterLiveWallpaperEvents() {
    ipcRenderer.off(Events.SetLiveWallpaper, liveWallpaperHandler);

    ipcRenderer.off(Events.SetLiveWallpaperMuted, liveWallpaperMutedHandler);

    ipcRenderer.off(Events.SetLiveWallpaperVolume, liveWallpaperVolumeHandler);
  }

  useMount(() => {
    registerLiveWallpaperEvents();
  });

  useUnmount(() => {
    unregisterLiveWallpaperEvents();
  });

  useUpdateEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.src = paths[currentIndex];
    videoRef.current.load();
    videoRef.current.play();
  }, [currentIndex]);

  return (
    <video
      style={{ ...props.style }}
      ref={(ref) => {
        if (ref) {
          videoRef.current = ref;
        }
      }}
      src={paths[0]}
      className={styles.liveWallpaperContainer}
      autoPlay
      muted
      onLoadedMetadata={() => {
        ipcRenderer.send(Events.LiveWallpaperLoaded, Number(displayId));
      }}
      loop={paths.length === 1}
      onEnded={() => {
        if (currentIndex + 1 === paths.length) {
          setCurrentIndex(0);
        } else {
          setCurrentIndex(currentIndex + 1);
        }
      }}
    />
  );
};

export default LiveWallpaper;
