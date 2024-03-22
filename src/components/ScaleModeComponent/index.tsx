import React, { useState } from 'react';
import { DefaultOptionType } from 'rc-select/lib/Select';
import { useTranslation } from 'react-i18next';
import { useMount } from 'ahooks';
import { ipcRenderer } from 'electron';
import {
  Events,
  MacOSScaleMode,
  WallpaperMode,
  WebScaleMode,
  WindowsScaleMode,
} from '../../../cross/enums';
import { Settings, TranslationFunc } from '../../../cross/interface';
import { settingsService } from '@/services/settings';

export interface ScaleModeComponentProps {
  children?: (
    scaleModeOptions: DefaultOptionType[],
  ) => React.ReactNode | JSX.Element;
}

const ScaleModeComponent: React.FC<ScaleModeComponentProps> = (props) => {
  const { t }: { t: TranslationFunc } = useTranslation();

  const [platform, setPlatform] = useState<NodeJS.Platform>();
  const [settings, setSettings] = useState<Settings>();

  useMount(async () => {
    setPlatform(await ipcRenderer.invoke(Events.GetPlatform));

    setSettings(await settingsService.get());
  });

  let scaleModeOptions: DefaultOptionType[] = [];

  if (settings?.wallpaperMode === WallpaperMode.Cover) {
    scaleModeOptions = [
      { label: t('scaleMode.default'), value: undefined },
      { label: t('webScaleMode.fill'), value: WebScaleMode.Fill },
      { label: t('webScaleMode.contain'), value: WebScaleMode.Contain },
      { label: t('webScaleMode.cover'), value: WebScaleMode.Cover },
    ];
  } else {
    switch (platform) {
      default:
      case 'win32':
        scaleModeOptions = [
          { label: t('scaleMode.default'), value: undefined },
          { label: t('scaleMode.fit'), value: WindowsScaleMode.Fit },
          { label: t('scaleMode.center'), value: WindowsScaleMode.Center },
          { label: t('scaleMode.stretch'), value: WindowsScaleMode.Stretch },
          { label: t('scaleMode.fill'), value: WindowsScaleMode.Fill },
          { label: t('scaleMode.tile'), value: WindowsScaleMode.Tile },
          { label: t('scaleMode.span'), value: WindowsScaleMode.Span },
        ];
        break;
      case 'darwin':
        scaleModeOptions = [
          { label: t('scaleMode.default'), value: undefined },
          { label: t('scaleMode.fit'), value: MacOSScaleMode.Fit },
          { label: t('scaleMode.center'), value: MacOSScaleMode.Center },
          { label: t('scaleMode.stretch'), value: MacOSScaleMode.Stretch },
          { label: t('scaleMode.fill'), value: MacOSScaleMode.Fill },
          { label: t('scaleMode.auto'), value: MacOSScaleMode.Auto },
        ];
        break;
    }
  }

  return props.children?.(scaleModeOptions) || null;
};

export default ScaleModeComponent;
