import { ModalProps } from 'antd';
import {
  ChangeType,
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

export interface ModalFormProps<ValueType = any> {
  values?: ValueType;
  onChange?: (data?: ValueType) => Promise<void> | void;
  mode?: FormMode;
  open?: ModalProps['open'];
  modalProps?: Omit<ModalProps, 'open'>;
}

export interface BeanWithId {
  id?: string;
}

export interface Rule extends BeanWithId {
  start: string;
  end: string;
  wallpaperType: WallpaperType;
  type: ChangeType;
  path: string;
  paths: string[];
  interval?: number;
  weekdayId: Weekday['id'];
  remark?: string;
  isRandom?: boolean;
  screenRandom?: boolean;
  direction: WallpaperDirection;
  column: number;
}

export interface Weekday extends BeanWithId {
  days: number[];
  id?: string;
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
}

export type TranslationFunc = (key: keyof ITranslation) => string;

export interface DBData {
  rules: Rule[];
  weekdays: Weekday[];
  settings: Settings;
  currentIndex: number;
  websites: WallpaperWebsite[];
  migrations: string[];
}

export type DBTableKey = 'rules' | 'weekdays' | 'websites';

export interface IDBService {
  setItem<Key extends keyof DBData>(
    key: Key,
    data: DBData[Key],
  ): void | Promise<void>;

  getItem<Key extends keyof DBData>(
    key: Key,
  ): DBData[Key] | Promise<DBData[Key]>;
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
}
