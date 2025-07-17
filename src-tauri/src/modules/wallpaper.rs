use crate::modules::enums::{Event, WallpaperMode, WallpaperType};
use crate::modules::ext::{AppStoreExt, MonitorExt, WebviewWindowExt};
use crate::modules::utils::is_window_debug;
use crate::modules::wallpaper_window;
use crate::structs::marquee::Marquee;
use crate::structs::monitor_wallpaper_loader::MonitorWallpaperLoader;
use crate::structs::rule::Rule;
use anyhow::Result;
use serde::Serialize;
use serde_json::{json, to_value};
use std::error::Error;
use std::sync::Arc;
use std::thread::sleep;
use std::time::Duration;
use tauri::{AppHandle, Listener, Manager, Monitor, Url};

fn is_wallpaper_native_mode(app_handle: &AppHandle) -> Result<bool> {
    let settings = app_handle.settings()?;

    Ok(settings.wallpaper_mode == WallpaperMode::Native)
}

fn set_native_wallpaper(
    app_handle: &AppHandle,
    path: &str,
) -> std::result::Result<(), Box<dyn Error>> {
    let settings = app_handle.settings()?;

    wallpaper::set_from_path(path)?;
    wallpaper::set_mode(settings.scale_mode.0)?;

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        log::info!("Run extra command on macos: killall WallpaperAgent");
        Command::new("killall").arg("WallpaperAgent").output()?;
    }

    Ok(())
}

fn load_wallpaper_by_monitor<S: Serialize + Clone + Send + 'static + Sync + std::fmt::Debug>(
    loader: MonitorWallpaperLoader<S>,
) -> Result<()> {
    let MonitorWallpaperLoader {
        app_handle,
        loaded_event,
        set_wallpaper_event,
        payload,
        monitor,
        route,
    } = loader;

    let payload = Arc::new(payload.clone());

    let window_id = monitor.name_md5()?;
    match app_handle.get_webview_window(window_id.as_str()) {
        Some(window) => {
            window.emit_to_self(set_wallpaper_event, &payload)?;
            window
        }
        None => {
            let win =
                wallpaper_window::create_wallpaper_window_by_monitor(app_handle, monitor, route)?;
            let win_arc = Arc::new(win.clone());
            let win_clone = Arc::clone(&win_arc);

            win.listen(loaded_event, move |event| {
                log::debug!(
                    "Window wallpaper loaded, window label: {}",
                    win_clone.label()
                );
                match win_clone.is_visible() {
                    Ok(true) => {
                        win_clone.unlisten(event.id());
                    }
                    Ok(false) => {
                        if win_clone.show().is_err() {
                            log::error!("Failed to show window {}", win_clone.label());
                        } else {
                            #[cfg(all(target_os = "macos"))]
                            {
                                if !is_window_debug() {
                                    wallpaper_window::set_desktop_level(&win_clone);
                                }
                            }

                            win_clone.unlisten(event.id());
                        }
                    }
                    Err(_) => {}
                }
            });

            let win_clone = Arc::clone(&win_arc);
            let set_wallpaper_event_clone = set_wallpaper_event.to_string().clone();

            let win_ready_listener = move |event: tauri::Event| {
                log::debug!("Window ready, window label: {}", win_clone.label());
                let payload_clone = Arc::clone(&payload);

                sleep(Duration::from_millis(500));

                if let Err(e) =
                    win_clone.emit_to_self(set_wallpaper_event_clone.as_str(), &payload_clone)
                {
                    log::error!("Failed to emit set wallpaper event to window, event: {}, window label: {}, error: {:?}", set_wallpaper_event_clone.as_str(), win_clone.label(), e);
                } else {
                    win_clone.unlisten(event.id());
                }
            };
            win_arc.listen(Event::WallpaperWinReady.to_string(), win_ready_listener);

            win
        }
    };

    Ok(())
}

pub fn set_horizontal_static_wallpaper(
    app_handle: &AppHandle,
    path: String,
    monitor: &Monitor,
) -> Result<()> {
    let payload = json!({
        "path": path,
    });

    load_wallpaper_by_monitor(MonitorWallpaperLoader {
        app_handle,
        loaded_event: Event::HoriStaticWallpaperLoaded.to_string().as_str(),
        set_wallpaper_event: Event::SetHoriStaticWallpaper.to_string().as_str(),
        monitor,
        route: "/wallpaper/static-hori",
        payload: &payload,
    })?;

    Ok(())
}

pub fn set_vertical_static_wallpaper(
    app_handle: &AppHandle,
    rule: &Rule,
    paths: &Vec<String>,
    monitor: &Monitor,
) -> Result<()> {
    log::debug!("Start to set vertical static wallpaper");
    
    if let Some(win) = app_handle.get_webview_window(monitor.name_md5()?.as_str()) {
        win.close()?;
    }
    
    let payload = json!({
        "rule": to_value(rule)?,
        "paths": paths,
    });

    load_wallpaper_by_monitor(MonitorWallpaperLoader {
        app_handle,
        loaded_event: Event::VertStaticWallpaperLoaded.to_string().as_str(),
        set_wallpaper_event: Event::SetVertStaticWallpaper.to_string().as_str(),
        monitor,
        route: "/wallpaper/static-vert",
        payload: &payload,
    })?;

    Ok(())
}

pub fn set_live_wallpaper(
    app_handle: &AppHandle,
    rule: &Rule,
    paths: &Vec<String>,
    monitor: &Monitor,
) -> Result<()> {
    if let Some(win) = app_handle.get_webview_window(monitor.name_md5()?.as_str()) { 
        win.close()?;
    }
    
    let payload = json!({
        "rule": to_value(rule)?,
        "paths": paths,
    });

    load_wallpaper_by_monitor(MonitorWallpaperLoader {
        app_handle,
        loaded_event: Event::LiveWallpaperLoaded.to_string().as_str(),
        set_wallpaper_event: Event::SetLiveWallpaper.to_string().as_str(),
        monitor,
        route: "/wallpaper/live",
        payload: &payload,
    })?;

    Ok(())
}

pub fn set_marquee_wallpaper(
    app_handle: &AppHandle,
    marquee: &Marquee,
    monitor: &Monitor,
) -> Result<()> {
    if let Some(win) = app_handle.get_webview_window(monitor.name_md5()?.as_str()) { 
        win.close()?;
    }
    
    let payload = json!({
        "marquee": to_value(marquee)?,
    });

    load_wallpaper_by_monitor(MonitorWallpaperLoader {
        app_handle,
        loaded_event: Event::MarqueeWallpaperLoaded.to_string().as_str(),
        set_wallpaper_event: Event::SetMarqueeWallpaper.to_string().as_str(),
        monitor,
        route: "/wallpaper/marquee",
        payload: &payload,
    })?;

    Ok(())
}

pub fn set_webpage_wallpaper(
    app_handle: &AppHandle,
    url_str: &str,
    monitor: &Monitor,
) -> Result<()> {
    if let Some(win) = app_handle.get_webview_window(monitor.name_md5()?.as_str()) {
        win.close()?;
    }
    
    let window = wallpaper_window::create_wallpaper_window_by_monitor(app_handle, monitor, "")?;

    let url = Url::parse(url_str)?;
    window.navigate(url.clone())?;

    Ok(())
}

pub fn set_fixed_wallpaper(app_handle: &AppHandle, rule: &Rule) -> Result<()> {
    wallpaper_window::destroy_wallpaper_windows(app_handle)?;
    
    let paths = rule.paths.clone().unwrap_or(vec![]);
    if paths.is_empty() {
        return Err(anyhow::anyhow!("Paths is empty."));
    }
    let file_path = &paths[0];
    log::info!("set_fixed_wallpaper: {}", file_path);

    match rule.wallpaper_type {
        Some(WallpaperType::Image) => {
            if is_wallpaper_native_mode(app_handle)? {
                if let Err(e) = set_native_wallpaper(app_handle, file_path) {
                    log::error!("Failed to set native wallpaper: {:?}", e);
                }
            } else {
                for monitor in app_handle.available_monitors()? {
                    set_horizontal_static_wallpaper(app_handle, file_path.to_string(), &monitor)?
                }
            }
            Ok(())
        }
        Some(WallpaperType::Video) => {
            for monitor in app_handle.available_monitors()? {
                set_live_wallpaper(app_handle, rule, &paths, &monitor)?
            }
            Ok(())
        }
        None => Err(anyhow::anyhow!("Wallpaper type is missing.")),
    }
}
