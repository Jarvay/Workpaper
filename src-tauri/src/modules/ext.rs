use crate::structs::album::Album;
use crate::structs::marquee::Marquee;
use crate::structs::rule::Rule;
use crate::structs::settings::Settings;
use crate::structs::webpage::Webpage;
use crate::structs::weekday::Weekday;
use serde::Serialize;
use serde_json::from_value;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Monitor, WebviewWindow, Wry};
use tauri_plugin_store::{Store, StoreExt};

pub trait MonitorExt {
    fn name_md5(&self) -> anyhow::Result<String>;
}
impl MonitorExt for Monitor {
    fn name_md5(&self) -> anyhow::Result<String> {
        match self.name() {
            Some(name) => Ok(format!("{:?}", md5::compute(name))),
            None => Err(anyhow::anyhow!("Get monitor name failed")),
        }
    }
}

pub trait WebviewWindowExt {
    fn emit_to_self<S>(&self, event: &str, payload: S) -> tauri::Result<()>
    where
        S: Serialize + Clone;
}
impl WebviewWindowExt for WebviewWindow {
    fn emit_to_self<S>(&self, event: &str, payload: S) -> tauri::Result<()>
    where
        S: Serialize + Clone,
    {
        self.emit_to(self.label(), event, payload)
    }
}

pub trait AppStoreExt {
    fn config_store(&self) -> tauri_plugin_store::Result<Arc<Store<Wry>>>;

    fn cache_store(&self) -> tauri_plugin_store::Result<Arc<Store<Wry>>>;

    fn settings(&self) -> anyhow::Result<Settings>;
}
impl AppStoreExt for AppHandle {
    fn config_store(&self) -> tauri_plugin_store::Result<Arc<Store<Wry>>> {
        self.store("config.json")
    }

    fn cache_store(&self) -> tauri_plugin_store::Result<Arc<Store<Wry>>> {
        self.store("cache.json")
    }

    fn settings(&self) -> anyhow::Result<Settings> {
        let config_store = self.config_store()?;

        match config_store.get("settings") {
            Some(settings) => Ok(from_value(settings)?),
            None => Err(anyhow::Error::msg("No settings found in config file")),
        }
    }
}

pub trait ConfigStoreExt {
    fn albums(&self) -> anyhow::Result<Vec<Album>>;

    fn marquees(&self) -> anyhow::Result<Vec<Marquee>>;

    fn rules(&self) -> anyhow::Result<Vec<Rule>>;

    fn webpages(&self) -> anyhow::Result<Vec<Webpage>>;

    fn weekdays(&self) -> anyhow::Result<Vec<Weekday>>;
}

impl ConfigStoreExt for Store<Wry> {
    fn albums(&self) -> anyhow::Result<Vec<Album>> {
        match self.get("albums") {
            Some(value) => Ok(from_value(value)?),
            None => Err(anyhow::Error::msg("No albums found in store")),
        }
    }

    fn marquees(&self) -> anyhow::Result<Vec<Marquee>> {
        match self.get("marquees") {
            Some(value) => Ok(from_value(value)?),
            None => Err(anyhow::Error::msg("No marquees found in store")),
        }
    }

    fn rules(&self) -> anyhow::Result<Vec<Rule>> {
        match self.get("rules") {
            Some(value) => Ok(from_value(value)?),
            None => Err(anyhow::Error::msg("No rules found in store")),
        }
    }

    fn webpages(&self) -> anyhow::Result<Vec<Webpage>> {
        match self.get("webpages") {
            Some(value) => Ok(from_value(value)?),
            None => Err(anyhow::Error::msg("No webpages found in store")),
        }
    }

    fn weekdays(&self) -> anyhow::Result<Vec<Weekday>> {
        match self.get("weekdays") {
            Some(value) => Ok(from_value(value)?),
            None => Err(anyhow::Error::msg("No weekdays found in store")),
        }
    }
}
