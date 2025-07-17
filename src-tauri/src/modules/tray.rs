use crate::modules::locale::Locale;
use anyhow::Result;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Wry};

pub fn build_tray_menu(app_handle: &AppHandle) -> Result<Menu<Wry>> {
    let show_win_i = MenuItem::with_id(
        app_handle,
        "show",
        Locale::get_item_or_default("tray.menu.showMainWin", "Show Main Window"),
        true,
        None::<&str>,
    )?;
    let quit_i = MenuItem::with_id(
        app_handle,
        "quit",
        Locale::get_item_or_default("tray.menu.quit", "quit"),
        true,
        None::<&str>,
    )?;
    let menu = Menu::with_items(app_handle, &[&show_win_i, &quit_i])?;
    Ok(menu)
}

fn show_main_window(app_handle: &AppHandle) {
    if let Some(main_win) = app_handle.get_window("main") {
        let _ = main_win.show();
    } else {
        log::warn!("No main window found");
    }
}

pub fn init_tray(app_handle: &AppHandle) -> Result<()> {
    let menu = build_tray_menu(app_handle)?;

    let mut tray_builder = TrayIconBuilder::with_id("main");

    #[cfg(target_os = "windows")]
    {
        tray_builder =
            tray_builder.icon(Image::from_bytes(include_bytes!("../../icons/tray.ico"))?);
    }

    #[cfg(not(target_os = "windows"))]
    {
        tray_builder =
            tray_builder.icon(Image::from_bytes(include_bytes!("../../icons/tray.png"))?);
    }

    tray_builder
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|icon, event| {
            #[cfg(target_os = "windows")]
            match event {
                TrayIconEvent::DoubleClick { .. } => show_main_window(icon.app_handle()),
                _ => {}
            }
            #[cfg(not(target_os = "windows"))]
            match event {
                TrayIconEvent::Click { .. } => show_main_window(icon.app_handle()),
                _ => {}
            }
        })
        .on_menu_event(|app_handle, event| match event.id.as_ref() {
            "show" => show_main_window(app_handle),
            "quit" => {
                app_handle.exit(0);
            }
            _ => {}
        })
        .build(app_handle)?;
    Ok(())
}
