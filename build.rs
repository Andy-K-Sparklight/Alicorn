use std::path::PathBuf;

fn main() {
    // Custom build logic
    let root = PathBuf::from(
        std::env::var_os("CARGO_MANIFEST_DIR").expect("Cargo should provide the package directory"),
    );
    let output = PathBuf::from(
        std::env::var_os("OUT_DIR").expect("Cargo should provide the build output directory"),
    );
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=alicorn-build.toml");
    let source = std::fs::read_to_string(root.join("alicorn-build.toml"))
        .expect("The build configuration should be readable");
    let config = toml::from_str(&source)
        .expect("The build configuration should contain supported TOML settings");
    alicorn_build::build(&config, &root, &output);

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
}
