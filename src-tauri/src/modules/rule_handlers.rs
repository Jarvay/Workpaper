use crate::modules;
use crate::modules::enums::{WallpaperDirection, WallpaperType};
use crate::modules::ext::AppStoreExt;
use crate::modules::wallpaper::{
    set_fixed_wallpaper, set_horizontal_static_wallpaper, set_live_wallpaper,
    set_marquee_wallpaper, set_webpage_wallpaper,
};
use crate::modules::wallpaper_window;
use crate::structs::rule::Rule;
use anyhow::Result;
use rand::Rng;
use serde_json::{from_value, json};
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;
use tokio_cron_scheduler::{Job, JobScheduler};
use tokio_util::sync::CancellationToken;

fn cron_timezone() -> Result<chrono_tz::Tz> {
    Ok(iana_time_zone::get_timezone()?.parse::<chrono_tz::Tz>()?)
}

fn next_img_index(current: usize, total: usize) -> usize {
    if current + 1 >= total {
        0
    } else {
        current + 1
    }
}

pub async fn handle_fixed(
    app_handle: &AppHandle,
    rule: &Rule,
    scheduler: &JobScheduler,
    day: usize,
) -> Result<()> {
    let is_current_rule = rule.is_current(day)?;
    let cron = rule.start_cron(day)?;

    if is_current_rule {
        set_fixed_wallpaper(app_handle, rule)?;
    } else {
        let app_handle = app_handle.clone();
        let rule = rule.clone();

        let job = Job::new(cron, move |_, _| {
            if let Err(e) = set_fixed_wallpaper(&app_handle, &rule) {
                log::error!("Failed to set fixed wallpaper: {}", e);
            }
        })?;
        scheduler.add(job).await?;
    }
    Ok(())
}

fn update_horizontal_static_wallpaper(app_handle: &AppHandle, rule: &Rule) -> Result<()> {
    let album = rule.album(app_handle)?;
    let cache_store = app_handle.cache_store()?;

    let file_paths = album.file_paths();
    if file_paths.is_empty() {
        log::info!("file_paths is empty");
        return Ok(());
    }

    let current_index: usize =
        from_value(cache_store.get("currentIndex").unwrap_or_else(|| json!(0)))?;
    let mut next_index = next_img_index(current_index, file_paths.len());

    let is_random = rule.is_random.unwrap_or(false);
    let screen_random = is_random && rule.screen_random.unwrap_or(false);

    if is_random {
        let mut rng = rand::rng();
        next_index = rng.random_range(0..file_paths.len() - 1);
    }
    let mut file_path = &file_paths[next_index];

    for monitor in app_handle.available_monitors()? {
        if screen_random {
            let mut rng = rand::rng();
            let index = rng.random_range(0..file_paths.len() - 1);
            file_path = &file_paths[index];
        }
        set_horizontal_static_wallpaper(app_handle, file_path.to_string(), &monitor)?;
    }

    if !is_random {
        cache_store.set("currentIndex", next_index);
    }

    Ok(())
}
async fn create_horizontal_static_wallpaper_timer(
    app_handle: &AppHandle,
    rule: &Rule,
    scheduler: &JobScheduler,
    day: usize,
) -> Result<()> {
    log::debug!("Creating horizontal static wallpaper timer");

    wallpaper_window::destroy_wallpaper_windows(app_handle)?;

    let cancel_token = CancellationToken::new();
    let child_token = cancel_token.child_token();
    let interval = rule.interval.unwrap_or_else(|| 30);

    let app_handle_clone = app_handle.clone();
    let rule_clone = rule.clone();

    let interval_task = tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(interval as u64));

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    if let Err(e) = update_horizontal_static_wallpaper(&app_handle_clone, &rule_clone) {
                        log::error!("Failed to update static wallpaper: {}", e);
                    }
                }
                _ = child_token.cancelled() => {
                    log::info!("Stop static wallpaper timer");
                    break;
                }
            }
        }
    });

    let stop_cron = rule.end_cron(day)?;
    let stop_rule_job = Job::new_tz(stop_cron, cron_timezone()?, |_, _| {})?;
    scheduler.add(stop_rule_job).await?;

    match modules::rule::CANCEL_TOKENS.lock() {
        Ok(mut tokens) => {
            tokens.push(cancel_token);
        }
        Err(e) => {
            log::error!("Failed to lock CANCEL_TOKENS: {}", e);
        }
    }

    interval_task.await?;
    Ok(())
}

async fn handle_vertical_album(
    app_handle: &AppHandle,
    rule: &Rule,
    scheduler: &JobScheduler,
    is_current_rule: bool,
    cron: String,
) -> Result<()> {
    let rule_arc = Arc::new(rule.clone());

    let app_handle_arc = Arc::new(app_handle.clone());

    let album = rule.album(app_handle)?;
    let paths = album.file_paths();

    if is_current_rule {
        for monitor in app_handle.available_monitors()? {
            modules::wallpaper::set_vertical_static_wallpaper(app_handle, rule, &paths, &monitor)?;
        }
    } else {
        let job = Job::new_cron_job_async_tz(cron, cron_timezone()?, move |_, _| {
            let app_handle = Arc::clone(&app_handle_arc);
            let rule_clone = Arc::clone(&rule_arc);
            let paths = paths.clone();

            Box::pin(async move {
                for monitor in app_handle.available_monitors().unwrap_or(Vec::new()).iter() {
                    if let Err(e) = modules::wallpaper::set_vertical_static_wallpaper(
                        &app_handle,
                        &rule_clone,
                        &paths,
                        &monitor,
                    ) {
                        log::error!("Failed to set vertical static wallpaper: {}", e);
                    }
                }
            })
        });
        scheduler.add(job?).await?;
    }

    Ok(())
}

async fn handle_horizontal_album(
    app_handle: &AppHandle,
    rule: &Rule,
    scheduler: &JobScheduler,
    day: usize,
    is_current_rule: bool,
    cron: String,
) -> Result<()> {
    let rule_arc = Arc::new(rule.clone());
    let rule_clone = Arc::clone(&rule_arc);

    let app_handle_arc = Arc::new(app_handle.clone());
    let app_handle_clone = Arc::clone(&app_handle_arc);

    let scheduler_arc = Arc::new(scheduler.clone());

    if is_current_rule {
        create_horizontal_static_wallpaper_timer(&app_handle_clone, &rule_clone, &scheduler, day)
            .await?;
    } else {
        let job = Job::new_cron_job_async_tz(cron, cron_timezone()?, move |_, _| {
            let app_handle = Arc::clone(&app_handle_arc);
            let scheduler_clone = Arc::clone(&scheduler_arc);
            let rule_clone = Arc::clone(&rule_arc);

            Box::pin(async move {
                if let Err(e) = create_horizontal_static_wallpaper_timer(
                    &app_handle,
                    &rule_clone,
                    &scheduler_clone,
                    day,
                )
                .await
                {
                    log::error!("Create horizontal static wallpaper timer failed: {}", e);
                }
            })
        });
        scheduler.add(job?).await?;
    }

    Ok(())
}

pub async fn handle_album(
    app_handle: &AppHandle,
    rule: &Rule,
    scheduler: &JobScheduler,
    day: usize,
) -> Result<()> {
    let is_current_rule = rule.is_current(day)?;
    let cron = rule.start_cron(day)?;

    let monitors = Arc::new(app_handle.available_monitors()?.clone());
    let monitors_clone = Arc::clone(&monitors);

    let album = rule.album(app_handle)?;
    match album.wallpaper_type {
        WallpaperType::Image => match album.direction {
            Some(WallpaperDirection::Vertical) => {
                handle_vertical_album(app_handle, rule, scheduler, is_current_rule, cron).await?;
            }
            Some(WallpaperDirection::Horizontal) => {
                handle_horizontal_album(app_handle, rule, scheduler, day, is_current_rule, cron)
                    .await?;
            }
            None => {
                log::debug!("Wallpaper type is None of album: {:?}", album);
            }
        },
        WallpaperType::Video => {
            let paths = album.file_paths();
            let rule_arc = Arc::new(rule.clone());
            let rule_clone = Arc::clone(&rule_arc);

            if is_current_rule {
                for monitor in monitors_clone.iter() {
                    set_live_wallpaper(app_handle, &rule_clone, &paths, &monitor)?;
                }
            } else {
                let app_handle = app_handle.clone();

                let job = Job::new(cron, move |_, _| {
                    for monitor in monitors_clone.iter() {
                        if let Err(e) =
                            set_live_wallpaper(&app_handle, &rule_clone, &paths, &monitor)
                        {
                            log::error!("Failed to set live wallpaper: {}", e);
                        }
                    }
                })?;
                scheduler.add(job).await?;
            }
        }
    }

    Ok(())
}

pub async fn handle_marquee(
    app_handle: &AppHandle,
    rule: &Rule,
    scheduler: &JobScheduler,
    day: usize,
) -> Result<()> {
    let is_current_rule = rule.is_current(day)?;
    let cron = rule.start_cron(day)?;

    let monitors = Arc::new(app_handle.available_monitors()?.clone());
    let monitors_clone = Arc::clone(&monitors);

    let marquee = rule.marquee(app_handle)?;

    if is_current_rule {
        for monitor in monitors_clone.iter() {
            set_marquee_wallpaper(app_handle, &marquee, &monitor)?;
        }
    } else {
        let app_handle = app_handle.clone();

        let job = Job::new(cron, move |_, _| {
            for monitor in monitors_clone.iter() {
                if let Err(e) = set_marquee_wallpaper(&app_handle, &marquee, &monitor) {
                    log::error!("Failed to set marquee wallpaper: {}", e);
                }
            }
        })?;
        scheduler.add(job).await?;
    }

    Ok(())
}

pub async fn handle_webpage(
    app_handle: &AppHandle,
    rule: &Rule,
    scheduler: &JobScheduler,
    day: usize,
) -> Result<()> {
    let is_current_rule = rule.is_current(day)?;
    let cron = rule.start_cron(day)?;

    let monitors = Arc::new(app_handle.available_monitors()?);
    let monitors_clone = Arc::clone(&monitors);

    let webpage = rule.webpage(app_handle)?;

    if is_current_rule {
        for monitor in monitors_clone.iter() {
            set_webpage_wallpaper(app_handle, webpage.url.as_str(), &monitor)?;
        }
    } else {
        let app_handle = app_handle.clone();

        let job = Job::new(cron, move |_, _| {
            for monitor in monitors_clone.iter() {
                if let Err(e) = set_webpage_wallpaper(&app_handle, webpage.url.as_str(), &monitor) {
                    log::error!("Failed to set webpage wallpaper: {}", e);
                }
            }
        })?;
        scheduler.add(job).await?;
    }

    Ok(())
}
