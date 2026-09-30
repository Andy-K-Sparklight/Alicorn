#[macro_export]
macro_rules! default_new {
    ($name:ty) => {
        impl Default for $name {
            fn default() -> Self { Self::new() }
        }
    };
}
