use std::ffi::OsStr;
use std::fs;
use crate::modules::enums::{AlbumType, WallpaperDirection, WallpaperType};
use crate::{modules, public_struct};
use serde::{Deserialize, Serialize};

public_struct!(AlbumFileListItem {
    path: String,
    thumb: String,
});

public_struct!(Album {
  id: String,
  name: String,
  dir: String,
  paths: Option<Vec<AlbumFileListItem>>,
  direction: Option<WallpaperDirection>,
  wallpaper_type: WallpaperType,
  r#type: AlbumType,
});

impl Album {
    pub fn support_extensions(&self) -> Vec<&str> {
        match self.wallpaper_type {
            WallpaperType::Image => vec!["jpg", "jpeg", "png", "heic", "webp"],
            WallpaperType::Video => vec!["mp4"],
        }
    }

    pub fn file_paths(&self) -> Vec<String> {
        if let Ok(cache) = modules::rule::ALBUM_CACHE.read() {
            if let Some(paths) = cache.get(&self.id) {
                return paths.clone();
            }
        }

        let paths = match self.r#type {
            AlbumType::Files => {
                if self.paths.is_some() {
                    self
                        .clone()
                        .paths
                        .unwrap_or(Vec::new())
                        .iter()
                        .map(|item| item.path.to_string())
                        .collect()
                } else {
                    Vec::new()
                }
            }
            AlbumType::Directories => match fs::read_dir(self.dir.as_str()) {
                Ok(entries) => entries
                    .filter_map(|entry| entry.ok())
                    .filter(|entry| entry.path().is_file())
                    .filter_map(|entry| {
                        let path = entry.path();
                        let path_clone = path.clone();
                        path.extension().and_then(OsStr::to_str).and_then(|ext| {
                            let ext_lower = ext.to_ascii_lowercase();
                            self
                                .support_extensions()
                                .iter()
                                .any(|&sup_ext| sup_ext.to_ascii_lowercase() == ext_lower)
                                .then_some(path_clone)
                        })
                    })
                    .filter_map(|path| path.to_str().map(String::from))
                    .collect(),
                Err(_) => Vec::new(),
            },
        };
        if let Ok(mut cache) = modules::rule::ALBUM_CACHE.write() {
            cache.insert(self.id.to_string(), paths.clone());
        }

        paths
    }
}
