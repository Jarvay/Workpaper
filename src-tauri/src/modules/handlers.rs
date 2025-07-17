use crate::modules;
use crate::modules::enums::Locale;
use tauri::AppHandle;

#[tauri::command]
pub fn reset_schedule(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        if modules::rule::reset_schedule(&app_handle).await.is_err() { 
            log::error!("Failed to reset schedule");
        }
    });
}
#[tauri::command]
pub fn update_tray_locale(app_handle: AppHandle, locale: Locale) {
    log::info!("update tray locale: {:?}", locale);

    if let Err(err) = modules::locale::Locale::reload_translations(&app_handle, &locale) {
        log::error!("Failed to reload translations: {:?}", err);
        return;
    }

    let tray = match app_handle.tray_by_id("main") {
        Some(tray) => tray,
        None => {
            log::error!("Tray with ID 'main' not found");
            return;
        }
    };
    let menu = match modules::tray::build_tray_menu(&app_handle) {
        Ok(menu) => menu,
        Err(err) => {
            log::error!("Failed to build tray menu: {:?}", err);
            return;
        }
    };
    if let Err(err) = tray.set_menu(Some(menu)) {
        log::error!("Failed to set tray menu: {:?}", err);
    }
}
