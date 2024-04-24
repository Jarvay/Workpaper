import { ModalProps } from 'antd';
import {
  ChangeType,
  FormMode,
  Locale,
  MacOSScaleMode,
  WallpaperDirection,
  WallpaperMode,
  WallpaperType,
  WebScaleMode,
  WindowsScaleMode,
} from './enums';
import { ITranslation } from './locale/i-translation';

export interface ModalFormProps<ValueType = any> extends ModalProps {
  values?: ValueType;
  onChange?: (data?: ValueType) => Promise<void> | void;
  mode?: FormMode;
}

export interface Rule {
  start: string;
  end: string;
  wallpaperType: WallpaperType;
  type: ChangeType;
  path: string;
  paths: string[];
  interval?: number;
  id?: string;
  weekdayId: Weekday['id'];
  remark?: string;
  isRandom?: boolean;
  screenRandom?: boolean;
  direction: WallpaperDirection;
  column: number;
}

export interface Weekday {
  days: number[];
  id?: string | number;
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
}

export type TranslationFunc = (key: keyof ITranslation) => string;

export interface DBData {
  rules: Rule[];
  weekdays: Weekday[];
  settings: Settings;
  currentIndex: number;
  migrations: string[];
}

export interface IDBService {
  setItem<Key extends keyof DBData>(
    key: Key,
    data: DBData[Key],
  ): void | Promise<void>;

  getItem<Key extends keyof DBData>(
    key: Key,
  ): DBData[Key] | Promise<DBData[Key]>;
}

export interface StaticWallpaperEventArg {
  path: string;
  rule: Rule;
  paths: string[];
}
