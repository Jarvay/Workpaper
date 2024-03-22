export enum ChangeType {
  Fixed,
  AutoChange,
}

export enum FormMode {
  Create,
  Update,
}

export enum Events {
  SelectImage = 'SelectImage',
  SelectVideo = 'SelectVideo',
  SelectDir = 'SelectDir',

  ResetSchedule = 'ResetSchedule',

  SaveRules = 'SaveRules',
  SaveWeekdays = 'SaveWeekdays',

  GetLocale = 'GetLocale',
  SettingsChange = 'SettingsChange',
  InitSettings = 'InitSettings',

  GetPlatform = 'GetPlatform',

  SetStaticWallpaper = 'SetStaticWallpaper',
  SetLiveWallpaper = 'SetLiveWallpaper',
  SetLiveWallpaperMuted = 'SetLiveWallpaperMuted',
  SetLiveWallpaperVolume = 'SetLiveWallpaperVolume',

  SetDBItem = 'SetDBItem',
  GetDBItem = 'GetDBItem',

  WallpaperWinReady = 'WallpaperWinReady',
  LiveWallpaperLoaded = 'LiveWallpaperLoaded',
  StaticWallpaperLoaded = 'StaticWallpaperLoaded',

  GetVersion = 'GetVersion',
  OpenExternal = 'OpenExternal',
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
