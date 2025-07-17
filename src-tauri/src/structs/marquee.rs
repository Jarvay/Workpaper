use crate::public_struct;
use serde::{Deserialize, Serialize};

public_struct!(Marquee {
    id: String,
    text: String,
    background_color: String,
    text_color: String,
    font_size: usize,
    speed: usize,
    letter_spacing: usize,
});
