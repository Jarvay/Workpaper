use crate::modules::enums::{Locale, WallpaperMode, WallpaperScaleMode, WebScaleMode};
use crate::public_struct;
use serde::{Deserialize, Serialize};

public_struct!(Settings {
    locale: Locale,
    scale_mode: WallpaperScaleMode,
    web_scale_mode: WebScaleMode,
    wallpaper_mode: WallpaperMode,
    volume: usize,
    muted: bool,
    auto_check_update: bool,
    downloads_dir: String,
    pause_when_blur: bool,
    pause_play_shortcut: String,
});
