use crate::modules::enums::RuleType;
use crate::modules::ext::{AppStoreExt, ConfigStoreExt};
use crate::modules::{rule_handlers, wallpaper_window};
use crate::structs::rule::Rule;
use crate::structs::weekday::Weekday;
use once_cell::sync::Lazy;
use serde_json::{json};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use tauri::AppHandle;
use tokio_cron_scheduler::JobScheduler;
use tokio_util::sync::CancellationToken;

type CancelTokenVec = Vec<CancellationToken>;

pub(crate) static ALBUM_CACHE: Lazy<RwLock<HashMap<String, Vec<String>>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

pub(crate) static CANCEL_TOKENS: Lazy<Mutex<CancelTokenVec>> = Lazy::new(|| Mutex::new(Vec::new()));

async fn execute_rule(app_handle: &AppHandle, rule: &Rule, day: usize, scheduler: &JobScheduler) {
    match rule.r#type {
        RuleType::Fixed => {
            if let Err(e) = rule_handlers::handle_fixed(app_handle, rule, scheduler, day).await {
                log::error!("Start fixed rule failed, {:?}", e);
            }
        }
        RuleType::Album => {
            if let Err(e) = rule_handlers::handle_album(app_handle, rule, scheduler, day).await {
                log::error!("Start album rule failed, {:?}", e);
            }
        }
        RuleType::Marquee => {
            if let Err(e) = rule_handlers::handle_marquee(app_handle, rule, scheduler, day).await {
                log::error!("Start marquee rule failed, {:?}", e);
            }
        }
        RuleType::Webpage => {
            if let Err(e) = rule_handlers::handle_webpage(app_handle, rule, scheduler, day).await {
                log::error!("Start webpage rule failed, {:?}", e);
            }
        }
    }
}

fn clear_static_wallpaper_timers() {
    match CANCEL_TOKENS.lock() {
        Ok(mut cancel_tokens) => {
            for cancel_token in cancel_tokens.iter() {
                cancel_token.cancel();
            }
            cancel_tokens.clear();
        }
        Err(e) => {
            log::error!("Failed to clear wallpaper timers, {:?}", e);
        }
    }
}

pub async fn start_schedule(app_handle: &AppHandle) -> anyhow::Result<()> {
    let store = app_handle.config_store()?;
    let rules: Vec<Rule> = store.rules()?;

    let weekdays: Vec<Weekday> = store.weekdays()?;

    let scheduler = JobScheduler::new().await?;
    let scheduler_arc = Arc::new(scheduler);

    for rule in rules.iter() {
        let weekday_opt = weekdays.iter().find(|item| item.id == rule.weekday_id);
        match weekday_opt {
            Some(weekday) => {
                for day in &weekday.days {
                    execute_rule(app_handle, rule, *day, &scheduler_arc).await;
                }
            }
            None => {
                log::error!("No weekday found in rule {}", rule.weekday_id);
            }
        }
    }

    scheduler_arc.start().await?;

    Ok(())
}

pub async fn reset_schedule(app_handle: &AppHandle) -> anyhow::Result<()> {
    log::info!("reset_schedule start");
    clear_static_wallpaper_timers();

    wallpaper_window::destroy_wallpaper_windows(app_handle)?;

    if let Ok(mut cache) = ALBUM_CACHE.write() {
        cache.clear();
    }

    start_schedule(app_handle).await?;

    Ok(())
}
