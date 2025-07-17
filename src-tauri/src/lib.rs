mod modules;
mod structs;

use crate::modules::ext::AppStoreExt;
use crate::modules::handlers::{reset_schedule, update_tray_locale};
use crate::modules::{config, shortcut, tray};
use std::sync::Arc;
use tauri::{Context, Wry};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use tauri_plugin_log::TimezoneStrategy;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let context: Context<Wry> = tauri::generate_context!();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(target_os = "windows")]
    {
        builder = builder.plugin(tauri_plugin_wallpaper::init());
    }

    builder = builder
        .plugin(
            tauri_plugin_log::Builder::new()
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init());
    builder
        .setup(move |app| {
            let app_handle = Arc::new(app.handle().clone());

            config::init_store(app)?;
            let settings = (&app_handle).settings()?;

            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(|app_handle, shortcut, event| {
                        match shortcut::handle_shortcut(app_handle, shortcut, event) {
                            Ok(_) => {}
                            Err(e) => {
                                log::error!("Handle shortcut error: {:?}", e)
                            }
                        }
                    })
                    .build(),
            )?;
            app.handle()
                .global_shortcut()
                .register::<Shortcut>(settings.pause_play_shortcut.try_into()?)?;

            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;

                app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec![]),
                ))?;
            }

            let app_handle_clone = Arc::clone(&app_handle);
            modules::locale::Locale::init(&app_handle_clone)?;

            if let Err(e) = tray::init_tray(&app_handle_clone) {
                log::error!("Failed to initialize tray: {:?}", e);
            }

            tauri::async_runtime::spawn(async move {
                match modules::rule::start_schedule(&app_handle_clone).await {
                    Ok(_) => {}
                    Err(e) => {
                        log::error!("Failed to start schedule: {:?}", e);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                if window.label() == "main" {
                    log::info!("Main window request to close");
                    if let Err(e) = window.hide() {
                        log::error!("Failed to hide main window: {}", e);
                    }
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![reset_schedule, update_tray_locale])
        .run(context)
        .expect("error while running tauri application");
}
