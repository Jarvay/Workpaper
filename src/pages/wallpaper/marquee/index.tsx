import React, { useRef, useState } from 'react';
import ReactFastMarquee from 'react-fast-marquee';
import { EventCallback, UnlistenFn } from '@tauri-apps/api/event';
import { MarqueeEventArg } from '@/others/types.ts';
import { Events } from '@/others/enums';
import { useMount, useUnmount } from 'ahooks';
import styles from './index.module.less';
import { emitToSelf, emitWinReadyEvent, listenSelf } from '@/others/utils.ts';

const Marquee: React.FC = () => {
  const [arg, setArg] = useState<MarqueeEventArg>();

  const unlistenFnListRef = useRef<UnlistenFn[]>([]);

  const marqueeWallpaperHandler: EventCallback<any> = (event) => {
    setArg(event.payload);
  };

  async function registerMarqueeWallpaperEvents() {
    unlistenFnListRef.current.push(
      await listenSelf(Events.SetMarqueeWallpaper, marqueeWallpaperHandler),
    );
  }

  function unregisterMarqueeWallpaperEvents() {
    unlistenFnListRef.current.forEach((item) => item());
  }

  useMount(async () => {
    await registerMarqueeWallpaperEvents();

    await emitWinReadyEvent();
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
      onMount={async () => {
        await emitToSelf(Events.MarqueeWallpaperLoaded);
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
