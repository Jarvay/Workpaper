use serde::{Deserialize, Serialize};
use crate::public_struct;
use crate::structs::album::Album;
use crate::structs::marquee::Marquee;
use crate::structs::rule::Rule;
use crate::structs::webpage::Webpage;
use crate::structs::weekday::Weekday;

public_struct!(OldVersionConfig {
   rules: Vec<Rule>,
   weekdays: Vec<Weekday>,
   albums: Vec<Album>,
   marquees: Vec<Marquee>,
   webpages: Vec<Webpage>,
});