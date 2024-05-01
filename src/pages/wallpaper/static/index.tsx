import React, { useMemo, useRef, useState } from 'react';
import { Settings, StaticWallpaperEventArg } from '../../../../cross/interface';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import { settingsService } from '@/services/settings';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { Events, WallpaperDirection } from '../../../../cross/enums';
import { useParams } from 'react-router-dom';
import styles from './index.module.less';
import { Carousel, Col, Row } from 'antd';
import { cloneDeep, isEqual, omit, range, shuffle } from 'lodash';
import { CarouselRef } from 'antd/es/carousel';
import ImageCarousel from '@/pages/wallpaper/static/ImageCarousel';

const SPEED = 1500;

interface HorizontalIndex {
  current: number;
  next: number;
}

const StaticWallpaper: React.FC = () => {
  const [settings, setSettings] = useState<Settings>();
  const verticalCarouselRefs = useRef<CarouselRef[]>([]);
  const [staticWallpaperArg, setStaticWallpaperArg] =
    useState<StaticWallpaperEventArg>();
  const [path, setPath] = useState<string>();
  const [loadedColumnIndexSet, setLoadedColumnIndexSet] = useState(
    new Set<number>(),
  );
  const [readyToShow, setReadyToShow] = useState(false);
  const [horizontalIndex, setHorizontalIndex] = useState<HorizontalIndex>({
    current: 0,
    next: 0,
  });

  const shuffledCarouselPaths = useMemo(() => {
    if (!staticWallpaperArg) return [];
    return range(0, staticWallpaperArg.rule.column).map((_, index) => {
      return shuffle(staticWallpaperArg?.paths || []);
    });
  }, [staticWallpaperArg?.paths.length, staticWallpaperArg?.rule.column]);

  const { displayId } = useParams();

  const staticWallpaperHandler: (
    event: IpcRendererEvent,
    ...args: any[]
  ) => void = (_, arg: StaticWallpaperEventArg) => {
    const a = cloneDeep(omit(arg, 'path'));
    const b = cloneDeep(omit(staticWallpaperArg, 'path'));
    if (!isEqual(a, b)) {
      setStaticWallpaperArg(arg);
    }
    setPath(arg.path);
  };

  function registerStaticWallpaperEvents() {
    ipcRenderer.on(Events.SetStaticWallpaper, staticWallpaperHandler);
  }

  function unregisterStaticWallpaperEvents() {
    ipcRenderer.off(Events.SetStaticWallpaper, staticWallpaperHandler);
  }

  useMount(async () => {
    setSettings(await settingsService.get());

    ipcRenderer.send(Events.WallpaperWinReady, Number(displayId));

    registerStaticWallpaperEvents();
  });

  useUnmount(() => {
    unregisterStaticWallpaperEvents();
  });

  useUpdateEffect(() => {
    const index = staticWallpaperArg?.paths.some((p) => p === path)
      ? staticWallpaperArg?.paths.findIndex((p) => p === path)
      : 0;
    setHorizontalIndex({
      ...horizontalIndex,
      next: index,
    });
  }, [path, staticWallpaperArg]);

  useUpdateEffect(() => {
    const loaded = loadedColumnIndexSet.size;
    const column = staticWallpaperArg?.rule.column;
    if (loaded === column) {
      setTimeout(() => {
        ipcRenderer.send(Events.StaticWallpaperLoaded, Number(displayId));
        setReadyToShow(true);
      }, 500);
    }
  }, [loadedColumnIndexSet, staticWallpaperArg?.rule.column]);

  let children = null;

  const column = staticWallpaperArg?.rule.column || 3;
  const interval = staticWallpaperArg?.rule.interval || 30;

  switch (staticWallpaperArg?.rule.direction) {
    case WallpaperDirection.Horizontal:
      children = (
        <ImageCarousel
          paths={staticWallpaperArg?.paths}
          imgStyle={{
            objectFit: settings?.webScaleMode,
          }}
          carouselIndex={horizontalIndex}
          onImgLoad={(index) => {
            if (index === 0) {
              ipcRenderer.send(Events.StaticWallpaperLoaded, Number(displayId));
              setReadyToShow(true);
            }
          }}
          carouselProps={{
            afterChange: (currentSlide: number) => {
              setHorizontalIndex({
                ...horizontalIndex,
                current: horizontalIndex.next,
              });
            },
          }}
        />
      );
      break;
    case WallpaperDirection.Vertical:
      children = (
        <Row>
          {range(0, column).map((_, index) => {
            return (
              <Col key={index} span={24 / column}>
                <Carousel
                  ref={(ref) => {
                    if (ref) {
                      verticalCarouselRefs.current[index] = ref;
                    }
                  }}
                  fade
                  dots={false}
                  autoplaySpeed={index === 0 ? interval * 1000 : undefined}
                  autoplay={index === 0}
                  speed={SPEED}
                  afterChange={() => {
                    if (index + 1 >= verticalCarouselRefs.current.length) {
                      return;
                    }
                    setTimeout(() => {
                      if (!readyToShow) return;
                      try {
                        verticalCarouselRefs.current[index + 1].next();
                      } catch (e) {
                        console.warn(e);
                      }
                    }, 100);
                  }}
                >
                  {shuffledCarouselPaths[index].map((item, i) => {
                    return (
                      <div key={item}>
                        <img
                          className={styles.carouselImg}
                          style={{
                            objectFit: settings?.webScaleMode,
                          }}
                          src={`file://${item}`}
                          alt=""
                          onLoad={() => {
                            if (i === 0) {
                              loadedColumnIndexSet.add(index);
                              setLoadedColumnIndexSet(
                                new Set(loadedColumnIndexSet),
                              );
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </Carousel>
              </Col>
            );
          })}
        </Row>
      );
  }

  return <div className={styles.wallpaperContainer}>{children}</div>;
};

export default StaticWallpaper;
