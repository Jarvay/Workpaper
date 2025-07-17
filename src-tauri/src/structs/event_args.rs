use crate::public_struct;
use crate::structs::album::Album;
use crate::structs::rule::Rule;
use serde::{Deserialize, Serialize};

public_struct!(StaticWallpaperArgs {
   path: String,
   paths: Vec<String>,
   rule: Rule,
   album: Album,
});
