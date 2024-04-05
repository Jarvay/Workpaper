import {
  MacOSScaleMode,
  WallpaperType,
  WebScaleMode,
  WindowsScaleMode,
} from './enums';

export const IMAGE_EXT_LIST = ['jpg', 'jpeg', 'png', 'heic', 'webp'];

export const VIDEO_EXT_LIST = ['mp4'];

export const DEFAULT_WEB_SCALE_MODE = WebScaleMode.Cover;

export const DEFAULT_NATIVE_SCALE_MODE = {
  win32: WindowsScaleMode.Fill,
  darwin: MacOSScaleMode.Auto,
};
