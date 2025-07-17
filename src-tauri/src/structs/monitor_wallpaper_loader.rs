use serde::Serialize;
use tauri::{AppHandle, Monitor};

#[derive(Debug, Clone)]
pub struct MonitorWallpaperLoader<'a, S>
where
    S: Serialize + Clone + Send + 'static + Sync + std::fmt::Debug,
{
    pub loaded_event: &'a str,
    pub set_wallpaper_event: &'a str,
    pub payload: &'a S,
    pub monitor: &'a Monitor,
    pub app_handle: &'a AppHandle,
    pub route: &'a str,
}
