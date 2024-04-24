import React, { useRef, useState } from 'react';
import { ipcRenderer, type IpcRendererEvent } from 'electron';
import { Events } from '../../../../cross/enums';
import { useParams } from 'react-router-dom';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import styles from './index.module.less';
import { settingsService } from '@/services/settings';
import { Settings } from '../../../../cross/interface';
import { Carousel } from 'antd';
import { CarouselRef } from 'antd/es/carousel';

const LiveWallpaper: React.FC = () => {
  const [paths, setPaths] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const { displayId } = useParams();

  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const carouselRef = useRef<CarouselRef>();

  const liveWallpaperHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, _paths: string[]) => {
    setPaths(_paths);
  };

  const liveWallpaperMutedHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, muted: boolean) => {
    videoRefs.current.forEach((item) => {
      item.muted = muted;
    });
  };

  const liveWallpaperVolumeHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, volume: number) => {
    videoRefs.current.forEach((item) => {
      item.volume = volume;
    });
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

  useMount(async () => {
    registerLiveWallpaperEvents();

    setSettings(await settingsService.get());

    ipcRenderer.send(Events.WallpaperWinReady, Number(displayId));
  });

  useUnmount(() => {
    unregisterLiveWallpaperEvents();
  });

  useUpdateEffect(() => {
    console.log('videoRefs.current[0]', videoRefs.current[0]);
    videoRefs.current[0].play();
  }, [paths, videoRefs.current[0]]);

  return (
    <Carousel
      dots={false}
      fade
      speed={800}
      ref={(ref) => {
        if (ref) {
          carouselRef.current = ref;
        }
      }}
      afterChange={async (currentSlide) => {
        await videoRefs.current[currentSlide].play();
      }}
    >
      {paths.map((path, index) => {
        return (
          <div key={index}>
            <video
              style={{ objectFit: settings?.webScaleMode }}
              ref={(ref) => {
                if (ref) {
                  videoRefs.current[index] = ref;
                }
              }}
              src={path}
              className={styles.liveWallpaperContainer}
              muted
              autoPlay={index === 0}
              onLoadedMetadata={() => {
                ipcRenderer.send(Events.LiveWallpaperLoaded, Number(displayId));
              }}
              loop={paths.length === 1}
              onEnded={() => {
                carouselRef.current?.next();
              }}
            />
          </div>
        );
      })}
    </Carousel>
  );
};

export default LiveWallpaper;
