import { WallpaperType } from './enums';

export const IMAGE_EXT_LIST = ['jpg', 'jpeg', 'png', 'heic', 'webp'];

export const VIDEO_EXT_LIST = ['mp4'];

export const WALLPAPER_TYPE_ROUTES = {
  [WallpaperType.Image]: 'static',
  [WallpaperType.Video]: 'live',
};
