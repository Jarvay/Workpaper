use anyhow::Result;
use std::env;

pub fn is_time_in_range(start: &str, end: &str, check: &str) -> Result<bool> {
    let start_sec = parse_time_to_seconds(start)?;
    let end_sec = parse_time_to_seconds(end)?;
    let check_sec = parse_time_to_seconds(check)?;

    Ok(start_sec <= check_sec && check_sec <= end_sec)
}

fn parse_time_to_seconds(time_str: &str) -> Result<u32> {
    let parts: Vec<&str> = time_str.split(':').collect();

    let hours: u32 = parts[0].parse()?;

    let minutes: u32 = parts[1].parse()?;

    let seconds: u32 = parts[2].parse()?;

    Ok(hours * 3600 + minutes * 60 + seconds)
}

pub fn is_window_debug() -> bool {
    if let Ok(_) = env::var("TAURI_WINDOW_DEBUG") {
        log::debug!("Window debug `true`");
        true
    } else {
        log::debug!("Window debug `false`");
        false
    }
}

pub fn parse_str_time(time: &str) -> Result<(usize, usize)> {
    let time_vec: Vec<&str> = time.split(":").collect();
    log::debug!("time_vec: {:?}", time_vec);
    let hour: usize = time_vec[0].parse()?;
    let minute: usize = time_vec[1].parse()?;
    Ok((hour, minute))
}