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
import MarqueeModal from '@/pages/marquee/components/MarqueeModal';

export interface ModalFormProps<ValueType = any> {
  values?: ValueType;
  onChange?: (data?: ValueType) => Promise<void> | void;
  mode?: FormMode;
  open?: ModalProps['open'];
  modalProps?: Omit<ModalProps, 'open'>;
}

export interface BeanWithId {
  id: string;
}

export interface Rule extends BeanWithId {
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
  wallpaperType: WallpaperType;
}

export interface Weekday extends BeanWithId {
  days: number[];
}

export interface Settings {
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
}

export type TranslationFunc = (key: keyof ITranslation) => string;

export interface ConfigData {
  rules: Rule[];
  weekdays: Weekday[];
  settings: Settings;
  websites: WallpaperWebsite[];
  migrations: string[];
  albums: Album[];
  marquees: Marquee[];
}

export type DBTableKey =
  | 'rules'
  | 'weekdays'
  | 'websites'
  | 'albums'
  | 'marquees';

export interface IDBService<DataType> {
  setItem<Key extends keyof DataType>(
    key: Key,
    data: DataType[Key],
  ): void | Promise<void>;

  getItem<Key extends keyof DataType>(
    key: Key,
  ): DataType[Key] | Promise<DataType[Key]>;
}

export interface WallpaperWebsiteRequestParam {
  key: string;
  value: string;
  type: WallpaperWebsiteRequestParamType;
}

export interface WallpaperWebsiteApi extends BeanWithId {
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
}

export interface WallpaperWebsiteWebsite extends BeanWithId {
  url: string;
}

export type WallpaperWebsite = WallpaperWebsiteApi &
  WallpaperWebsiteWebsite & {
    type: WallpaperWebsiteType;
    name: string;
    tags: {
      free: boolean;
      needToLogin: boolean;
    };
  };

export interface WallpaperItem {
  thumb: string;
  raw: string;
}

export interface DownloadArg {
  url: string;
  thumb: string;
}

export interface DownloadEvent extends DownloadArg {
  event: 'start' | 'progress';
  md5: string;
  filename: string;
  path: string;
  progress: number;
}

export interface StaticWallpaperEventArg {
  path: string;
  rule: Rule;
  paths: string[];
  album?: Album;
}

export interface LiveWallpaperEventArg {
  paths: string[];
  rule: Rule;
  album?: Album;
}

export interface Marquee extends BeanWithId {
  name: string;
  text: string;
  backgroundColor: ColorPickerProps['value'];
  textColor: ColorPickerProps['value'];
  fontSize: number;
  speed: number;
  letterSpacing: number;
}

export interface Album extends BeanWithId {
  name: string;
  dir: string;
  paths: AlbumFileListItem[];
  direction: WallpaperDirection;
  wallpaperType: WallpaperType;
  type: AlbumType;
  column?: number;
}

export interface MarqueeEventArg {
  rule: Rule;
  marquee: Marquee;
}

export interface AlbumFileListItem {
  path: string;
  thumb: string;
}

export interface ToAlbumFileListItemParams {
  files: string[];
  width: number;
  quality: number;
}
