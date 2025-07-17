export enum RuleType {
  Fixed,
  Album,
  Marquee,
  Webpage,
}

export enum FormMode {
  Create,
  Update,
}

export enum Events {
  ResetSchedule = 'reset_schedule',

  SetStaticWallpaper = 'set_static_wallpaper',
  SetVertStaticWallpaper = 'set_vert_static_wallpaper',
  SetHoriStaticWallpaper = 'set_hori_static_wallpaper',
  SetLiveWallpaper = 'set_live_wallpaper',
  SetMarqueeWallpaper = 'set_marquee_wallpaper',
  SetLiveWallpaperMuted = 'set_live_wall_muted',
  SetLiveWallpaperVolume = 'set_live_wall_volume',
  ToggleLiveWallpaperStatus = 'toggle_live_wallpaper_status',

  WallpaperWinReady = 'wallpaper_win_ready',
  LiveWallpaperLoaded = 'live_wallpaper_loaded',
  StaticWallpaperLoaded = 'static_wallpaper_loaded',
  VertStaticWallpaperLoaded = 'vert_static_wallpaper_loaded',
  HoriStaticWallpaperLoaded = 'hori_static_wallpaper_loaded',
  MarqueeWallpaperLoaded = 'marquee_wallpaper_loaded',

  Download = 'download',
  OnDownloadUpdated = 'on_download_updated',

  ToAlbumListItem = 'to_album_list_item',

  UnregisterGlobalShortcut = 'unregister_global_shortcut',

  UpdateTrayLocale = 'update_tray_locale',
}

export enum Locale {
  zhCN = 'zhCN',
  enUS = 'enUS',
}

export enum NativeScaleMode {
  Center = 'Center',
  Crop = 'Crop',
  Fit = 'Fit',
  Span = 'Span',
  Stretch = 'Stretch',
  Tile = 'Tile',
}

export enum WindowsScaleMode {
  Center = 'center',
  Stretch = 'stretch',
  Fit = 'fit',
  Fill = 'fill',
  Span = 'span',
  Tile = 'tile',
}

export enum MacOSScaleMode {
  Center = 'center',
  Stretch = 'stretch',
  Fit = 'fit',
  Fill = 'fill',
  Auto = 'auto',
}

export enum WebScaleMode {
  Fill = 'fill',
  Contain = 'contain',
  Cover = 'cover',
  None = 'none',
  ScaleDown = 'scale-down',
}

export enum WallpaperType {
  Image = 'Image',
  Video = 'Video',
}

export enum WallpaperMode {
  Native = 'native',
  Window = 'window',
}

export enum WallpaperDirection {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
}

export enum WallpaperWebsiteRequestParamType {
  Number = 'number',
  String = 'string',
  Placeholder = 'placeholder',
}

export enum WebsitePlaceholder {
  Page = '$(PAGE)$',
  PageSize = '$(PAGE_SIZE)$',
  CurrentCount = '$(CURRENT_COUNT)$',
}

export enum WallpaperWebsiteType {
  Api = 'api',
  Website = 'website',
}

export enum AlbumType {
  Directory,
  Files,
}
