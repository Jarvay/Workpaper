use crate::modules::enums::{RuleType, WallpaperType};
use crate::modules::ext::{AppStoreExt, ConfigStoreExt};
use crate::modules::utils::{is_time_in_range, parse_str_time};
use crate::public_struct;
use crate::structs::album::Album;
use crate::structs::marquee::Marquee;
use crate::structs::webpage::Webpage;
use chrono::{Datelike, Local};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

public_struct!(Rule {
    id: String,
    start: String,
    end: String,
    r#type: RuleType,
    paths: Option<Vec<String>>,
    interval: Option<usize>,
    weekday_id: String,
    remark: Option<String>,
    is_random: Option<bool>,
    screen_random: Option<bool>,
    column: Option<usize>,
    album_id: Option<String>,
    marquee_id: Option<String>,
    webpage_id: Option<String>,
    wallpaper_type: Option<WallpaperType>,
});

impl Rule {
    pub fn album(&self, app_handle: &AppHandle) -> anyhow::Result<Album> {
        if let Some(album_id) = &self.album_id {
            let albums: Vec<Album> = app_handle.config_store()?.albums()?;
            let album = albums
                .iter()
                .find(|item| item.id == album_id.to_string())
                .cloned();
            match album {
                Some(album) => Ok(album),
                None => Err(anyhow::Error::msg("No matching album found")),
            }
        } else {
            Err(anyhow::Error::msg(format!(
                "`album_id` is None of rule: {:?}",
                self
            )))
        }
    }

    pub fn marquee(&self, app_handle: &AppHandle) -> anyhow::Result<Marquee> {
        if let Some(marquee_id) = &self.marquee_id {
            let marquees: Vec<Marquee> = app_handle.config_store()?.marquees()?;
            let marquee = marquees
                .iter()
                .find(|item| item.id == marquee_id.to_string())
                .cloned();
            match marquee {
                Some(marquee) => Ok(marquee),
                None => Err(anyhow::Error::msg("No matching marquee found")),
            }
        } else {
            Err(anyhow::Error::msg(format!(
                "`marquee_id` is None of rule: {:?}",
                self
            )))
        }
    }

    pub fn webpage(&self, app_handle: &AppHandle) -> anyhow::Result<Webpage> {
        if let Some(webpage_id) = &self.webpage_id {
            let webpages: Vec<Webpage> = app_handle.config_store()?.webpages()?;
            let webpage = webpages
                .iter()
                .find(|item| item.id == webpage_id.to_string())
                .cloned();
            match webpage {
                Some(webpage) => Ok(webpage),
                None => Err(anyhow::Error::msg("No matching webpage found")),
            }
        } else {
            Err(anyhow::Error::msg(format!(
                "`webpage_id` is None of rule: {:?}",
                self
            )))
        }
    }

    pub fn is_current(&self, day: usize) -> anyhow::Result<bool> {
        let today = Local::now();
        let mut weekday = today.weekday().num_days_from_sunday();
        if weekday == 0 {
            weekday = 7;
        }

        if weekday != day as u32 {
            return Ok(false);
        }
        let start = format!("{}:00", self.start);
        let end = format!("{}:59", self.end);
        let now = Local::now().format("%H:%M:%S").to_string();

        Ok(is_time_in_range(start.as_str(), end.as_str(), now.as_str())?)
    }

    pub fn start_cron(&self, day: usize) -> anyhow::Result<String> {
        let (start_hour, start_minute) = parse_str_time(self.start.as_str())?;

        Ok(format!("0 {} {} * * {}", start_minute, start_hour, day))
    }

    pub fn end_cron(&self, day: usize) -> anyhow::Result<String> {
        let (end_hour, end_minute) = parse_str_time(self.end.as_str())?;

        Ok(format!("59 {} {} * * {}", end_minute, end_hour, day))
    }
}
