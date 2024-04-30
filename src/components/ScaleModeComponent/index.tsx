import React, { useState } from 'react';
import { DefaultOptionType } from 'rc-select/lib/Select';
import { useTranslation } from 'react-i18next';
import { useMount } from 'ahooks';
import { ipcRenderer } from 'electron';
import {
  Events,
  MacOSScaleMode,
  ScaleType,
  WebScaleMode,
  WindowsScaleMode,
} from '../../../cross/enums';

export interface ScaleModeComponentProps {
  children?: (
    scaleModeOptions: DefaultOptionType[],
  ) => React.ReactNode | JSX.Element;
  scaleType: ScaleType;
}

const ScaleModeComponent: React.FC<ScaleModeComponentProps> = (props) => {
  const { t } = useTranslation();

  const [platform, setPlatform] = useState<NodeJS.Platform>();

  useMount(async () => {
    setPlatform(await ipcRenderer.invoke(Events.GetPlatform));
  });

  let scaleModeOptions: DefaultOptionType[] = [];

  if (props.scaleType === ScaleType.Web) {
    scaleModeOptions = [
      { label: t('webScaleMode.fill'), value: WebScaleMode.Fill },
      { label: t('webScaleMode.contain'), value: WebScaleMode.Contain },
      { label: t('webScaleMode.cover'), value: WebScaleMode.Cover },
    ];
  } else {
    switch (platform) {
      default:
      case 'win32':
        scaleModeOptions = [
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
