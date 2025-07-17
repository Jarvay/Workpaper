import React, { useMemo, useRef, useState } from 'react';
import { Events } from '@/others/enums';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import styles from './index.module.less';
import { settingsService } from '@/services/settings';
import { LiveWallpaperEventArg, Rule, Settings } from '@/others/types.ts';
import { Carousel } from 'antd';
import { CarouselRef } from 'antd/es/carousel';
import {
  emitToSelf,
  emitWinReadyEvent,
  listenSelf,
  randomByRange,
} from '@/others/utils';
import { EventCallback, UnlistenFn } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';

const LiveWallpaper: React.FC = () => {
  const [paths, setPaths] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [nextIndex, setNextIndex] = useState<number>(1);
  const [rule, setRule] = useState<Rule>();
  const [isInitialed, setIsInitialed] = useState(false);

  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const carouselRef = useRef<CarouselRef>();

  const visibleIndexes = useMemo(() => {
    return [currentIndex, nextIndex];
  }, [paths, currentIndex, nextIndex]);

  const pathSources = useMemo(() => {
    return paths.map((item) => convertFileSrc(item));
  }, [paths]);

  const unlistenFnListRef = useRef<UnlistenFn[]>([]);

  const liveWallpaperHandler: EventCallback<LiveWallpaperEventArg> = ({
    payload: arg,
  }) => {
    setRule(arg.rule);
    setPaths(arg.paths);
  };

  const liveWallpaperMutedHandler: (event: any, ...args: any[]) => void = (
    _,
    muted: boolean,
  ) => {
    videoRefs.current[currentIndex].muted = muted;
  };

  const liveWallpaperVolumeHandler: EventCallback<{ volume: number }> = ({
    payload,
  }) => {
    videoRefs.current[currentIndex].volume = payload.volume;
  };

  const liveWallpaperToggleHandler = () => {
    const player = videoRefs.current[currentIndex];
    if (!player) return;
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  };

  async function registerLiveWallpaperEvents() {
    unlistenFnListRef.current = [
      await listenSelf(Events.SetLiveWallpaper, liveWallpaperHandler),

      await listenSelf(Events.SetLiveWallpaperMuted, liveWallpaperMutedHandler),

      await listenSelf(
        Events.SetLiveWallpaperVolume,
        liveWallpaperVolumeHandler,
      ),

      await listenSelf(
        Events.ToggleLiveWallpaperStatus,
        liveWallpaperToggleHandler,
      ),
    ];
  }

  function unregisterLiveWallpaperEvents() {
    unlistenFnListRef.current.forEach((item) => item());
  }

  useMount(async () => {
    await registerLiveWallpaperEvents();

    setSettings(await settingsService.get());

    await emitWinReadyEvent();
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
      {pathSources.map((path, index) => {
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
                onLoadedMetadata={async () => {
                  await emitToSelf(Events.LiveWallpaperLoaded);
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
