use crate::public_struct;
use serde::{Deserialize, Serialize};

public_struct!(
    Weekday {
        id: String,
        days: Vec<usize>
    }
);
