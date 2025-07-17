use crate::public_struct;
use serde::{Deserialize, Serialize};

public_struct!(Webpage {
    id: String,
    url: String,
    name: String,
});
