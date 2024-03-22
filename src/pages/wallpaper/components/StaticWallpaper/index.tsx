import React, { useMemo, useRef, useState } from 'react';
import { Settings } from '../../../../../cross/interface';
import { useMount, useUpdateEffect } from 'ahooks';
import { settingsService } from '@/services/settings';
import { ipcRenderer } from 'electron';
import { Events } from '../../../../../cross/enums';
import { useParams } from 'react-router-dom';
import styles from './index.module.less';

export interface StaticWallpaperProps {
  path?: string;
  style?: React.CSSProperties;
}

const StaticWallpaper: React.FC<StaticWallpaperProps> = (props) => {
  const [settings, setSettings] = useState<Settings>();

  const [paths, setPaths] = useState<string[]>([]);

  const imgRef = useRef<HTMLImageElement>();

  const { displayId } = useParams();

  useMount(async () => {
    setSettings(await settingsService.get());
    if (props.path) {
      setPaths([...paths, props.path]);
    }
  });

  useUpdateEffect(() => {
    if (!props.path) return;
    setPaths([...paths, props.path]);
  }, [props.path]);

  useUpdateEffect(() => {
    setTimeout(() => {
      if (paths.length > 3) {
        setPaths(paths.slice(-3));
      }
    }, 500);
  }, [paths]);

  return (
    <div className={styles.wallpaperContainer}>
      {paths.map((item, index) => (
        <img
          key={item}
          ref={(ref) => !!ref && (imgRef.current = ref)}
          alt=""
          src={`file://${item}`}
          className={[styles.fadeIn, styles.wallpaper].join(' ')}
          style={{
            width: '100vw',
            height: '100vh',
            objectFit: settings?.webScaleMode,
            zIndex: index + 5,
          }}
          onLoad={() => {
            ipcRenderer.send(Events.StaticWallpaperLoaded, Number(displayId));
          }}
        />
      ))}
    </div>
  );
};

export default StaticWallpaper;
