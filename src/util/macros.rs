/// Derive [`Default`] by invoking `new`.
#[macro_export]
macro_rules! default_by_new {
    ($name:ty) => {
        #[automatically_derived]
        impl Default for $name {
            fn default() -> Self { Self::new() }
        }
    };
}

/// Add `new` by invoking [`Default::default`].
#[macro_export]
macro_rules! new_by_default {
    ($v:vis $name:ty) => {
        impl $name {
            $v fn new() -> Self { Default::default() }
        }
    };
}

/// Generates a chain of calls to [`core::fmt::Write::write_str`].
#[macro_export]
macro_rules! write_strs {
    (
        $w:expr;
        $($s:expr),*
    ) => {
        try {
            $($w.write_str($s)?;)*
        }
    };
}

/// Includes an embedded file defined in `alicorn-build.toml`.
///
/// The embedded file will be made available as a module named as the supplied
/// identifier (which is also its filename, instead of being arbitrarily
/// specified), whose data can be accessed via `module_name::DATA`.
#[macro_export]
macro_rules! include_embedded {
    ($fp:ident) => {
        include!(concat!(env!("OUT_DIR"), "/embed/", stringify!($fp), ".rs"));
    };
}
