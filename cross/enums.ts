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
  SelectImage = 'SelectImage',
  SelectVideo = 'SelectVideo',
  SelectDir = 'SelectDir',
  OpenPath = 'OpenPath',

  ResetSchedule = 'ResetSchedule',
  GetLocale = 'GetLocale',
  SettingsChange = 'SettingsChange',
  InitSettings = 'InitSettings',

  GetPlatform = 'GetPlatform',

  SetStaticWallpaper = 'SetStaticWallpaper',
  SetLiveWallpaper = 'SetLiveWallpaper',
  SetMarqueeWallpaper = 'SetMarqueeWallpaper',
  SetWebpageWallpaper = 'SetWebpageWallpaper',
  SetLiveWallpaperMuted = 'SetLiveWallpaperMuted',
  SetLiveWallpaperVolume = 'SetLiveWallpaperVolume',
  PauseLiveWallpaper = 'PauseLiveWallpaper',
  PlayLiveWallpaper = 'PlayLiveWallpaper',

  SetDBItem = 'SetDBItem',
  GetDBItem = 'GetDBItem',

  WallpaperWinReady = 'WallpaperWinReady',
  LiveWallpaperLoaded = 'LiveWallpaperLoaded',
  StaticWallpaperLoaded = 'StaticWallpaperLoaded',
  MarqueeWallpaperLoaded = 'MarqueeWallpaperLoaded',

  GetVersion = 'GetVersion',
  OpenExternal = 'OpenExternal',
  IsPackaged = 'IsPackaged',

  Download = 'Download',
  OnDownloadUpdated = 'OnDownloadUpdated',

  ToAlbumListItem = 'ToAlbumListItem',

  UnregisterGlobalShortcut = 'UnregisterGlobalShortcut',
  OpenWindow = 'OpenWindow',
}

export enum Locale {
  zhCN = 'zhCN',
  enUS = 'enUS',
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
  Replace = 'replace',
  Cover = 'cover',
}

export enum ScaleType {
  Web = 'web',
  Native = 'native',
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
