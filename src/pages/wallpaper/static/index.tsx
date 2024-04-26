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

const SPEED = 1500;

const StaticWallpaper: React.FC = () => {
  const [settings, setSettings] = useState<Settings>();
  const imgRef = useRef<HTMLImageElement>();
  const verticalCarouselRefs = useRef<CarouselRef[]>([]);
  const horizontalCarouselRef = useRef<CarouselRef>();
  const [staticWallpaperArg, setStaticWallpaperArg] =
    useState<StaticWallpaperEventArg>();
  const [path, setPath] = useState<string>();

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
    registerStaticWallpaperEvents();

    setSettings(await settingsService.get());

    ipcRenderer.send(Events.WallpaperWinReady, Number(displayId));
  });

  useUnmount(() => {
    unregisterStaticWallpaperEvents();
  });

  useUpdateEffect(() => {
    if (!staticWallpaperArg) return;

    const { rule, paths } = staticWallpaperArg;
    if (rule.direction === WallpaperDirection.Vertical) {
      ipcRenderer.send(Events.StaticWallpaperLoaded, Number(displayId));
    }
  }, [staticWallpaperArg]);

  useUpdateEffect(() => {
    const index = staticWallpaperArg?.paths.some((p) => p === path)
      ? staticWallpaperArg?.paths.findIndex((p) => p === path)
      : 0;
    horizontalCarouselRef.current?.goTo(index, false);
  }, [path, staticWallpaperArg]);

  let children = null;

  const column = staticWallpaperArg?.rule.column || 3;
  const interval = staticWallpaperArg?.rule.interval || 30;

  switch (staticWallpaperArg?.rule.direction) {
    case WallpaperDirection.Horizontal:
      children = (
        <Carousel
          dots={false}
          fade
          speed={SPEED}
          ref={(ref) => {
            if (ref) {
              horizontalCarouselRef.current = ref;
            }
          }}
        >
          {staticWallpaperArg?.paths.map((item, index) => {
            return (
              <div key={item}>
                <img
                  ref={(ref) => !!ref && (imgRef.current = ref)}
                  alt=""
                  src={`file://${item}`}
                  className={[styles.wallpaper].join(' ')}
                  style={{
                    objectFit: settings?.webScaleMode,
                  }}
                  onLoad={() => {
                    ipcRenderer.send(
                      Events.StaticWallpaperLoaded,
                      Number(displayId),
                    );
                  }}
                />
              </div>
            );
          })}
        </Carousel>
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
                      verticalCarouselRefs.current[index + 1].next();
                    }, 100);
                  }}
                >
                  {shuffledCarouselPaths[index].map((item) => {
                    return (
                      <div key={item}>
                        <img
                          className={styles.carouselImg}
                          style={{
                            objectFit: settings?.webScaleMode,
                          }}
                          src={`file://${item}`}
                          alt=""
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
