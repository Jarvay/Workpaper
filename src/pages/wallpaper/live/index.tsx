import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ipcRenderer, type IpcRendererEvent } from 'electron';
import { Events } from '../../../../cross/enums';
import { useParams } from 'react-router-dom';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import styles from './index.module.less';
import { settingsService } from '@/services/settings';
import {
  LiveWallpaperEventArg,
  Rule,
  Settings,
} from '../../../../cross/interface';
import { Carousel } from 'antd';
import { CarouselRef } from 'antd/es/carousel';
import { randomByRange } from '../../../../cross/utils';

const LiveWallpaper: React.FC = () => {
  const [paths, setPaths] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [nextIndex, setNextIndex] = useState<number>(1);
  const [rule, setRule] = useState<Rule>();
  const [isInitialed, setIsInitialed] = useState(false);

  const { displayId } = useParams();

  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const carouselRef = useRef<CarouselRef>();

  const visibleIndexes = useMemo(() => {
    return [currentIndex, nextIndex];
  }, [paths, currentIndex, nextIndex]);

  const liveWallpaperHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, arg: LiveWallpaperEventArg) => {
    setRule(arg.rule);
    setPaths(arg.paths);
  };

  const liveWallpaperMutedHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, muted: boolean) => {
    videoRefs.current[currentIndex].muted = muted;
  };

  const liveWallpaperVolumeHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, volume: number) => {
    videoRefs.current[currentIndex].volume = volume;
  };

  const liveWallpaperPauseHandler = () => {
    videoRefs.current[currentIndex]?.pause();
  };

  const liveWallpaperPlayHandler = () => {
    videoRefs.current[currentIndex]?.play();
  };

  function registerLiveWallpaperEvents() {
    ipcRenderer.on(Events.SetLiveWallpaper, liveWallpaperHandler);

    ipcRenderer.on(Events.SetLiveWallpaperMuted, liveWallpaperMutedHandler);

    ipcRenderer.on(Events.SetLiveWallpaperVolume, liveWallpaperVolumeHandler);

    ipcRenderer.on(Events.PauseLiveWallpaper, liveWallpaperPauseHandler);
    ipcRenderer.on(Events.PlayLiveWallpaper, liveWallpaperPlayHandler);
  }

  function unregisterLiveWallpaperEvents() {
    ipcRenderer.removeAllListeners(Events.SetLiveWallpaper);

    ipcRenderer.removeAllListeners(Events.SetLiveWallpaperMuted);

    ipcRenderer.removeAllListeners(Events.SetLiveWallpaperVolume);

    ipcRenderer.removeAllListeners(Events.PauseLiveWallpaper);
    ipcRenderer.removeAllListeners(Events.PlayLiveWallpaper);
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
    unregisterLiveWallpaperEvents();
    registerLiveWallpaperEvents();
  }, [currentIndex]);

  useUpdateEffect(() => {
    if (isInitialed) return;
    let next = currentIndex + 1;
    let current = currentIndex;
    if (rule?.isRandom) {
      next = randomByRange(0, paths.length - 1);
      current = randomByRange(0, paths.length - 1);
      setCurrentIndex(current);
    }
    setNextIndex(next);
    carouselRef.current?.goTo(current);
    setIsInitialed(true);
  }, [rule, videoRefs.current]);

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
          <div key={path}>
            {!visibleIndexes.includes(index) ? null : (
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
                autoPlay={currentIndex === index}
                onLoadedMetadata={() => {
                  ipcRenderer.send(
                    Events.LiveWallpaperLoaded,
                    Number(displayId),
                  );
                }}
                loop={paths.length === 1}
                onEnded={() => {
                  carouselRef.current?.goTo(nextIndex);
                  let next = currentIndex + 1;
                  next = next > paths.length - 1 ? 0 : next;
                  if (rule?.isRandom) {
                    next = randomByRange(0, paths.length - 1);
                  }
                  setCurrentIndex(nextIndex);
                  setNextIndex(next);
                }}
              />
            )}
          </div>
        );
      })}
    </Carousel>
  );
};

export default LiveWallpaper;
