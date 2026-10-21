use std::path::PathBuf;

fn main() -> Result<(), Box<dyn core::error::Error>> {
    let root = PathBuf::from(
        std::env::var_os("CARGO_MANIFEST_DIR").expect("Cargo should provide the package directory"),
    );
    let output = PathBuf::from(
        std::env::var_os("OUT_DIR").expect("Cargo should provide the build output directory"),
    );

    let is_debug = std::env::var_os("CARGO_CFG_DEBUG_ASSERTIONS").is_some();

    // Build script references Node.js packages
    println!("cargo:rerun-if-changed=package.json");
    println!("cargo:rerun-if-changed=package-lock.json");

    let mut build = alicorn_build::AlicornBuild::new(alicorn_build::BuildOptions { root });
    build.use_config_file("alicorn-build.toml")?;
    build.make_available(output.join("embed"), is_debug)?;

    // Link to zlib
    let target_os = std::env::var("CARGO_CFG_TARGET_OS")
        .expect("Cargo should provide the target operating system");
    if target_os == "linux" {
        pkg_config::Config::new()
            .statik(false)
            .probe("zlib")
            .expect("The target sysroot should provide system zlib and its pkg-config metadata");
    }
    if target_os == "macos" || target_os == "linux" {
        println!("cargo:rustc-link-lib=dylib=z");
    }

    cfg_aliases::cfg_aliases! {
        use_common_crypto: {
            all(target_vendor = "apple", not(feature = "prefer-rust-impl"))
        },
        use_cng: { all(target_os = "windows", not(feature = "prefer-rust-impl")) },
        use_rust_crypto: { not(any(use_common_crypto, use_cng)) },
    }
    Ok(())
}
