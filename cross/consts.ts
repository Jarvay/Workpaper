import { MacOSScaleMode, WebScaleMode, WindowsScaleMode } from './enums';
import { Marquee } from './interface';

export const IMAGE_EXT_LIST = ['jpg', 'jpeg', 'png', 'heic', 'webp'];

export const VIDEO_EXT_LIST = ['mp4'];

export const DEFAULT_WEB_SCALE_MODE = WebScaleMode.Cover;

export const DEFAULT_NATIVE_SCALE_MODE: Record<string, any> = {
  win32: WindowsScaleMode.Fill,
  darwin: MacOSScaleMode.Auto,
};

export const DEFAULT_MARQUEE: Partial<Marquee> = {
  name: '',
  text: '',
  textColor: '#FF0000',
  backgroundColor: '#000000',
  speed: 100,
  fontSize: 200,
  letterSpacing: 8,
};
