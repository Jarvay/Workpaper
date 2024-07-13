import { ColorPickerProps, ModalProps } from 'antd';
import {
  AlbumType,
  RuleType,
  FormMode,
  Locale,
  MacOSScaleMode,
  WallpaperDirection,
  WallpaperMode,
  WallpaperType,
  WallpaperWebsiteRequestParamType,
  WallpaperWebsiteType,
  WebScaleMode,
  WindowsScaleMode,
} from './enums';
import { ITranslation } from './locale/i-translation';
import type { Method } from 'axios';

export type ModalFormProps<ValueType = any> = {
  values?: ValueType;
  onChange?: (data?: ValueType) => Promise<void> | void;
  mode?: FormMode;
  open?: ModalProps['open'];
  modalProps?: Omit<ModalProps, 'open'>;
};

export type BeanWithId = {
  id: string;
};

export type Rule = BeanWithId & {
  start: string;
  end: string;
  type: RuleType;
  paths: string[];
  interval?: number;
  weekdayId: Weekday['id'];
  remark?: string;
  isRandom?: boolean;
  screenRandom?: boolean;
  column: number;
  albumId: Album['id'];
  marqueeId: Marquee['id'];
  webpageId: Webpage['id'];
  wallpaperType: WallpaperType;
};

export type Weekday = BeanWithId & {
  days: number[];
};

export type Settings = {
  locale: Locale;
  scaleMode?: WindowsScaleMode | MacOSScaleMode | null;
  webScaleMode: WebScaleMode;
  wallpaperMode: WallpaperMode;
  volume: number;
  muted: boolean;
  autoCheckUpdate: boolean;
  openAtLogin: boolean;
  downloadsDir: string;
  pauseWhenBlur: boolean;
  pausePlayShortcut: string;
};

export type TranslationFunc = (key: keyof ITranslation) => string;

export type ConfigData = {
  rules: Rule[];
  weekdays: Weekday[];
  settings: Settings;
  websites: WallpaperWebsite[];
  migrations: string[];
  albums: Album[];
  marquees: Marquee[];
  webpages: Webpage[];
};

export type DBTableKey =
  | 'rules'
  | 'weekdays'
  | 'websites'
  | 'albums'
  | 'marquees'
  | 'webpages';

export type IDBService<DataType> = {
  setItem<Key extends keyof DataType>(
    key: Key,
    data: DataType[Key],
  ): void | Promise<void>;

  getItem<Key extends keyof DataType>(
    key: Key,
  ): DataType[Key] | Promise<DataType[Key]>;
};

export type WallpaperWebsiteRequestParam = {
  key: string;
  value: string;
  type: WallpaperWebsiteRequestParamType;
};

export type WallpaperWebsiteApi = BeanWithId & {
  request: {
    url: string;
    method: Method;
    params: WallpaperWebsiteRequestParam[];
  };
  responseKey: {
    list: string;
    thumbInItem: string;
    rawInItem: string;
  };
};

export type WallpaperWebsiteWebsite = BeanWithId & {
  url: string;
};

export type WallpaperWebsite = WallpaperWebsiteApi &
  WallpaperWebsiteWebsite & {
    type: WallpaperWebsiteType;
    name: string;
    tags: {
      free: boolean;
      needToLogin: boolean;
    };
  };

export type WallpaperItem = {
  thumb: string;
  raw: string;
};

export type DownloadArg = {
  url: string;
  thumb: string;
};

export type DownloadEvent = DownloadArg & {
  event: 'start' | 'progress';
  md5: string;
  filename: string;
  path: string;
  progress: number;
};

export type StaticWallpaperEventArg = {
  path: string;
  rule: Rule;
  paths: string[];
  album?: Album;
};

export type LiveWallpaperEventArg = {
  paths: string[];
  rule: Rule;
  album?: Album;
};

export type Marquee = BeanWithId & {
  name: string;
  text: string;
  backgroundColor: ColorPickerProps['value'];
  textColor: ColorPickerProps['value'];
  fontSize: number;
  speed: number;
  letterSpacing: number;
};

export type Webpage = BeanWithId & {
  url: string;
  name: string;
};

export type Album = BeanWithId & {
  name: string;
  dir: string;
  paths: AlbumFileListItem[];
  direction: WallpaperDirection;
  wallpaperType: WallpaperType;
  type: AlbumType;
  column?: number;
};

export type MarqueeEventArg = {
  rule: Rule;
  marquee: Marquee;
};

export type WebpageEventArg = {
  webpage: Webpage;
};

export type AlbumFileListItem = {
  path: string;
  thumb: string;
};

export type ToAlbumFileListItemParams = {
  files: string[];
  width: number;
  quality: number;
};
