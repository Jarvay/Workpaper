use crate::modules;
use crate::modules::ext::AppStoreExt;
use crate::structs::settings::Settings;
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

pub fn load_locales(
    app_handle: &AppHandle,
) -> anyhow::Result<HashMap<String, HashMap<String, String>>, Box<dyn std::error::Error>> {
    let mut translations = HashMap::new();

    let resource_dir = "resources/".to_string();

    let resource_path = app_handle
        .path()
        .resolve(resource_dir, BaseDirectory::Resource)?;
    let locales_dir = resource_path.join("locales");

    if !locales_dir.exists() {
        return Err("Locales directory not found".into());
    }

    for entry in std::fs::read_dir(locales_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            let lang = path
                .file_stem()
                .and_then(|s| s.to_str())
                .ok_or("Invalid filename")?
                .to_string();

            let content = std::fs::read_to_string(&path)?;
            let data: HashMap<String, String> = serde_json::from_str(&content)?;

            translations.insert(lang, data);
        }
    }

    Ok(translations)
}

static INSTANCE: OnceLock<Mutex<Locale>> = OnceLock::new();

#[derive(Clone)]
pub struct Locale {
    pub translations: HashMap<String, String>,
}
impl Locale {
    pub fn init(app_handle: &AppHandle) -> anyhow::Result<()> {
        let settings: Settings = app_handle.settings()?;
        let locale = settings.locale.clone();

        let translations = Self::load_translations(app_handle, &locale)?;
        INSTANCE.get_or_init(|| Mutex::new(Locale { translations }));
        Ok(())
    }

    fn load_translations(
        app_handle: &AppHandle,
        locale: &modules::enums::Locale,
    ) -> anyhow::Result<HashMap<String, String>> {
        let locales = load_locales(app_handle).expect("Failed to load translations");
        let translations = locales.get(&locale.to_string()).expect("No such Locale");
        Ok(translations.clone())
    }

    pub fn reload_translations(
        app_handle: &AppHandle,
        locale: &modules::enums::Locale,
    ) -> anyhow::Result<()> {
        let translations = Self::load_translations(app_handle, locale)?;
        let instance = INSTANCE.get_or_init(|| {
            Mutex::new(Locale {
                translations: translations.clone(),
            })
        });
        if let Ok(mut inst) = instance.lock() {
            inst.translations = translations.clone()
        }

        Ok(())
    }

    pub fn get_item(key: &str) -> Option<String> {
        let instance = INSTANCE.get()?;
        if let Ok(locale) = instance.lock() {
            let translations = locale.clone().translations.clone();
            return translations.get(key).cloned();
        }
        None
    }

    pub fn get_item_or_default(key: &str, default_value: &str) -> String {
        if let Some(value) = Self::get_item(key) {
            return value.to_string();
        }
        default_value.to_string()
    }
}
