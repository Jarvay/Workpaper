use crate::modules::enums::{Locale, WallpaperMode, WallpaperScaleMode, WebScaleMode};
use crate::structs::old_version_config::OldVersionConfig;
use crate::structs::settings::Settings;
use serde_json::{json, Value};
use std::sync::Arc;
use tauri::{App, AppHandle, Manager};
use crate::modules::ext::AppStoreExt;

pub fn get_default_settings(app_handle: &AppHandle) -> Value {
    let download_dir = match app_handle.path().download_dir() {
        Ok(path) => path
            .join("Workpaper")
            .to_str()
            .unwrap_or_else(|| "")
            .to_string(),
        Err(_) => "".to_string(),
    };
    log::debug!("download_dir {}", download_dir);

    let settings = Settings {
        locale: Locale::zhCN,
        scale_mode: WallpaperScaleMode(wallpaper::Mode::Crop),
        web_scale_mode: WebScaleMode::Cover,
        wallpaper_mode: WallpaperMode::Native,
        volume: 80,
        muted: true,
        auto_check_update: false,
        downloads_dir: download_dir,
        pause_when_blur: false,
        pause_play_shortcut: "Ctrl+Alt+P".to_string(),
    };

    json!(settings)
}
pub fn init_store(app: &App) -> anyhow::Result<()> {
    let app_handle = Arc::new(app.handle());

    let config_store = (&app_handle).config_store()?;
    let cache_store = (&app_handle).cache_store()?;

    let initialized = config_store.has("initialized");

    if initialized {
        return Ok(());
    }

    let old_ver_config_path = app_handle
        .path()
        .app_data_dir()?
        .join("../workpaper/userData/config.json");
    log::debug!("old_ver_config_path {:?}", old_ver_config_path);

    config_store.set("rules", json!([]));
    config_store.set("weekdays", json!([]));
    config_store.set("albums", json!([]));
    config_store.set("marquees", json!([]));
    config_store.set("webpages", json!([]));

    config_store.set("settings", get_default_settings(&app.handle()));
    config_store.set("websites", json!([]));
    config_store.set("initialized", true);
    
    if old_ver_config_path.is_file() {
        let content = std::fs::read_to_string(old_ver_config_path)?;
        log::debug!("content {}", content);
        if let Ok(old_ver_config) = serde_json::from_str::<OldVersionConfig>(&content) {
            log::debug!("rules: {:?}", old_ver_config.rules);
            
            config_store.set("rules", json!(old_ver_config.rules));
            config_store.set("weekdays", json!(old_ver_config.weekdays));
            config_store.set("albums", json!(old_ver_config.albums));
            config_store.set("marquees", json!(old_ver_config.marquees));
            config_store.set("webpages", json!(old_ver_config.webpages));
        }
    }

    cache_store.set("currentIndex", 0);

    Ok(())
}
