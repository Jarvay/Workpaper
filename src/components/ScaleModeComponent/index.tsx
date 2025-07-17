import React from 'react';
import { DefaultOptionType } from 'rc-select/lib/Select';
import { useTranslation } from 'react-i18next';
import { NativeScaleMode, WallpaperMode, WebScaleMode } from '@/others/enums';
import { TranslationFunc } from '@/others/types.ts';

export type ScaleModeComponentProps = {
  children?: (
    scaleModeOptions: DefaultOptionType[],
  ) => React.ReactNode | JSX.Element;
  wallpaperMode: WallpaperMode;
};

const ScaleModeComponent: React.FC<ScaleModeComponentProps> = (props) => {
  const t = useTranslation().t as TranslationFunc;

  let scaleModeOptions: DefaultOptionType[] = [];

  if (props.wallpaperMode === WallpaperMode.Window) {
    scaleModeOptions = [
      { label: t('webScaleMode.fill'), value: WebScaleMode.Fill },
      { label: t('webScaleMode.contain'), value: WebScaleMode.Contain },
      { label: t('webScaleMode.cover'), value: WebScaleMode.Cover },
    ];
  } else {
    scaleModeOptions = [
      { label: t('scaleMode.fit'), value: NativeScaleMode.Fit },
      { label: t('scaleMode.center'), value: NativeScaleMode.Center },
      { label: t('scaleMode.stretch'), value: NativeScaleMode.Stretch },
      { label: t('scaleMode.tile'), value: NativeScaleMode.Tile },
      { label: t('scaleMode.span'), value: NativeScaleMode.Span },
      { label: t('scaleMode.crop'), value: NativeScaleMode.Crop },
    ];
  }

  return props.children?.(scaleModeOptions) || null;
};

export default ScaleModeComponent;
