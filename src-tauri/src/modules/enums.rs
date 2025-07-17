use serde::de::Visitor;
use serde::{de, Deserialize, Deserializer, Serialize, Serializer};
use serde_repr::{Deserialize_repr, Serialize_repr};
use std::fmt;

#[derive(Debug, Deserialize, Serialize, Clone, Copy)]
pub enum WallpaperType {
    Image,
    Video,
}

#[derive(Debug, Deserialize, PartialEq, Eq, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum WallpaperMode {
    Native,
    Window,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum Locale {
    zhCN,
    enUS,
}
impl fmt::Display for Locale {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Locale::zhCN => write!(f, "zhCN"),
            Locale::enUS => write!(f, "enUS"),
        }
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum WebScaleMode {
    Fill,
    Contain,
    Cover,
    None,
    ScaleDown,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum WallpaperDirection {
    Vertical,
    Horizontal,
}

#[derive(Debug, Deserialize_repr, Serialize_repr, PartialEq, Clone)]
#[repr(u8)]
pub enum AlbumType {
    Directories = 0,
    Files = 1,
}

#[derive(Debug, Deserialize_repr, Serialize_repr, PartialEq, Clone)]
#[repr(u8)]
pub enum RuleType {
    Fixed = 0,
    Album = 1,
    Marquee = 2,
    Webpage = 3,
}

#[derive(Debug, Deserialize)]
pub enum Event {
    SetStaticWallpaper,
    SetVertStaticWallpaper,
    SetHoriStaticWallpaper,
    SetLiveWallpaper,
    SetMarqueeWallpaper,

    ToggleLiveWallpaperStatus,

    WallpaperWinReady,
    StaticWallpaperLoaded,
    VertStaticWallpaperLoaded,
    HoriStaticWallpaperLoaded,
    LiveWallpaperLoaded,
    MarqueeWallpaperLoaded,
    WebpageWallpaperLoaded,
}
impl fmt::Display for Event {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Event::WallpaperWinReady => write!(f, "wallpaper_win_ready"),

            Event::SetStaticWallpaper => write!(f, "set_static_wallpaper"),
            Event::SetVertStaticWallpaper => write!(f, "set_vert_static_wallpaper"),
            Event::SetHoriStaticWallpaper => write!(f, "set_hori_static_wallpaper"),
            Event::SetLiveWallpaper => write!(f, "set_live_wallpaper"),
            Event::SetMarqueeWallpaper => write!(f, "set_marquee_wallpaper"),

            Event::ToggleLiveWallpaperStatus => write!(f, "toggle_live_wallpaper_status"),

            Event::StaticWallpaperLoaded => write!(f, "static_wallpaper_loaded"),
            Event::VertStaticWallpaperLoaded => write!(f, "vert_static_wallpaper_loaded"),
            Event::HoriStaticWallpaperLoaded => write!(f, "hori_static_wallpaper_loaded"),
            Event::LiveWallpaperLoaded => write!(f, "live_wallpaper_loaded"),
            Event::MarqueeWallpaperLoaded => write!(f, "marquee_wallpaper_loaded"),
            Event::WebpageWallpaperLoaded => write!(f, "webpage_wallpaper_loaded"),
        }
    }
}

#[derive(Clone, Debug)]
pub struct WallpaperScaleMode(pub wallpaper::Mode);

impl Serialize for WallpaperScaleMode {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self.0 {
            wallpaper::Mode::Center => serializer.serialize_str("Center"),
            wallpaper::Mode::Crop => serializer.serialize_str("Crop"),
            wallpaper::Mode::Fit => serializer.serialize_str("Fit"),
            wallpaper::Mode::Span => serializer.serialize_str("Span"),
            wallpaper::Mode::Stretch => serializer.serialize_str("Stretch"),
            wallpaper::Mode::Tile => serializer.serialize_str("Tile"),
        }
    }
}

impl<'de> Deserialize<'de> for WallpaperScaleMode {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct ModeVisitor;

        impl<'de> Visitor<'de> for ModeVisitor {
            type Value = WallpaperScaleMode;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a string representing wallpaper mode")
            }

            fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
            where
                E: de::Error,
            {
                let mode = match value {
                    "Center" => wallpaper::Mode::Center,
                    "Crop" => wallpaper::Mode::Crop,
                    "Fit" => wallpaper::Mode::Fit,
                    "Span" => wallpaper::Mode::Span,
                    "Stretch" => wallpaper::Mode::Stretch,
                    "Tile" => wallpaper::Mode::Tile,
                    _ => {
                        return Err(E::custom(format!(
                            "Unsupported wallpaper scale mode: '{}'",
                            value
                        )))
                    }
                };
                Ok(WallpaperScaleMode(mode))
            }
        }

        deserializer.deserialize_str(ModeVisitor)
    }
}
