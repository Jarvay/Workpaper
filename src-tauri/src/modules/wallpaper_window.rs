use crate::modules::ext::MonitorExt;
use crate::modules::utils::is_window_debug;
use anyhow::Result;
use log;
use tauri::{AppHandle, Manager, Monitor, WebviewUrl, WebviewWindow};

pub fn destroy_wallpaper_windows(app_handle: &AppHandle) -> Result<()> {
    let mut windows = app_handle.webview_windows();

    let window_labels = windows.iter().map(|(label, _)| label).collect::<Vec<_>>();
    log::debug!("window_labels: {:?}", window_labels);

    for (label, window) in windows.iter_mut() {
        if label == "main" {
            continue;
        }

        log::debug!("Closing window label: `{}`", label);
        window.close()?;
        window.destroy()?;
    }

    Ok(())
}

#[cfg(target_os = "macos")]
pub fn set_desktop_level(window: &WebviewWindow) {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;

    let window_clone = window.clone();

    let _ = window.run_on_main_thread(move || unsafe {
        let ns_window: *mut AnyObject = window_clone
            .ns_window()
            .expect("Get ns_window failed")
            .cast();

        const KCG_DESKTOP_WINDOW_LEVEL: isize = -2147483603;

        let _: () = msg_send![ns_window, setLevel: KCG_DESKTOP_WINDOW_LEVEL];

        let _: () = msg_send![ns_window, setIgnoresMouseEvents: true];
    });
}

pub fn create_wallpaper_window_by_monitor<'a>(
    app_handle: &AppHandle,
    monitor: &Monitor,
    route: &str,
) -> Result<WebviewWindow> {
    let window_id = monitor.name_md5()?;

    if let Some(window) = app_handle.get_webview_window(window_id.as_str()) {
        return Ok(window);
    }

    let scale_factor = monitor.scale_factor();
    let width = monitor.size().width as f64 / scale_factor;
    let mut height = monitor.size().height as f64 / scale_factor;

    #[cfg(target_os = "macos")]
    {
        height += 8.0;
    }

    let route = format!("{}/{}", route, window_id);

    let formatted_route = if route.starts_with('#') {
        route.to_string()
    } else if route.starts_with('/') {
        format!("#{}", route)
    } else {
        format!("#/{}", route)
    };
    let route_with_params = format!("{}", formatted_route);
    let url = WebviewUrl::App(route_with_params.into());
    log::info!("Creating wallpaper window url: {}", url);

    let window_builder = tauri::WebviewWindowBuilder::new(app_handle, &window_id, url)
        .devtools(true)
        .resizable(false)
        .visible(is_window_debug())
        .always_on_bottom(true)
        .skip_taskbar(true)
        .decorations(false)
        .inner_size(width, height);

    let window = window_builder
        .build()
        .expect("Create wallpaper window failed");

    let monitor_position = monitor.position().clone();
    window.set_position(monitor_position)?;

    #[cfg(all(target_os = "windows"))]
    {
        window.center()?;
        window.set_fullscreen(true)?;
        if !is_window_debug() {
            use tauri_plugin_wallpaper::WallpaperExt;
            app_handle
                .wallpaper()
                .attach_window(&window)
                .expect("Failed to attach wallpaper window");
        }
    }

    #[cfg(debug_assertions)]
    {
        if is_window_debug() {
            window.set_resizable(true)?;
            window.set_always_on_bottom(false)?;
            window.set_skip_taskbar(false)?;
            window.set_decorations(true)?;
            window.set_fullscreen(false)?;
            window.maximize()?;
            window.open_devtools();
        }
    }

    Ok(window)
}
