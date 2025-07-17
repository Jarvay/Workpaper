#[macro_export]
macro_rules! public_struct {
    ($name:ident { $($field:ident: $ty:ty),* $(,)? }) => {
        #[derive(Debug, Deserialize, Serialize)]
        #[derive(Clone)]
        #[serde(rename_all = "camelCase")]
        pub struct $name {
                    $(pub $field: $ty),*
                }
            };
}
