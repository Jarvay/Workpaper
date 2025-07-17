import React, { useMemo, useRef, useState } from 'react';
import { EventCallback, UnlistenFn } from '@tauri-apps/api/event';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import { Events } from '@/others/enums.ts';
import { emitToSelf, emitWinReadyEvent, listenSelf } from '@/others/utils.ts';
import { Rule, VerticalWallpaperEventArgs } from '@/others/types.ts';
import styles from '@/pages/wallpaper/static/index.module.less';
import { Carousel, Col, Row } from 'antd';
import { range, shuffle } from 'lodash';
import { CarouselRef } from 'antd/es/carousel';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useSettings } from '@/components/GlobalContext';

const SPEED = 1200;
export const VerticalStaticWallpaper: React.FC = () => {
  const settings = useSettings();

  const [readyToShow, setReadyToShow] = useState(false);
  const [rule, setRule] = useState<Rule>();
  const [paths, setPaths] = useState<string[]>([]);
  const [loadedColumnIndexSet, setLoadedColumnIndexSet] = useState(
    new Set<number>(),
  );

  const column = useMemo(() => {
    return rule?.column || 3;
  }, [rule?.column]);

  const shuffledCarouselPaths = useMemo(() => {
    return range(0, column).map((_) => {
      return shuffle(paths || []);
    });
  }, [paths.length, column]);

  const verticalCarouselRefs = useRef<CarouselRef[]>([]);

  const unlistenFnListRef = useRef<UnlistenFn[]>([]);
  const wallpaperHandler: EventCallback<VerticalWallpaperEventArgs> = ({
    payload,
  }) => {
    setPaths(payload.paths);
    setRule(payload.rule);
  };

  async function registerListeners() {
    unlistenFnListRef.current = [
      await listenSelf(Events.SetVertStaticWallpaper, wallpaperHandler),
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

  useUpdateEffect(() => {
    const loaded = loadedColumnIndexSet.size;
    if (loaded === column) {
      setTimeout(async () => {
        await emitToSelf(Events.VertStaticWallpaperLoaded);
        setReadyToShow(true);
      }, 50);
    }
  }, [loadedColumnIndexSet, column]);

  const interval = rule?.interval || 30;

  return (
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
                }, 150);
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
                      src={convertFileSrc(item)}
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
};
