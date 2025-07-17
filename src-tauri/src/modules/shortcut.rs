use crate::modules::enums::Event;
use anyhow::Result;
use serde_json::json;
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{Shortcut, ShortcutEvent, ShortcutState};
use crate::modules::ext::AppStoreExt;

pub fn handle_shortcut(
    app_handle: &AppHandle,
    shortcut: &Shortcut,
    event: ShortcutEvent,
) -> Result<()> {
    let settings = app_handle.settings()?;
    if event.state != ShortcutState::Released {
        return Ok(());
    }

    log::debug!("Shortcut event: {:?}", shortcut.to_string());

    let video_toggle_shortcut = Shortcut::try_from(settings.pause_play_shortcut)?.to_string();

    if shortcut.to_string() == video_toggle_shortcut {
        app_handle.emit(
            Event::ToggleLiveWallpaperStatus.to_string().as_str(),
            json!({}),
        )?;
    }

    Ok(())
}
