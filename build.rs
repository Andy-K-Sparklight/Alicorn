fn main() {
    cfg_aliases::cfg_aliases! {
        use_common_crypto: {
            all(target_vendor = "apple", not(feature = "prefer-rust-impl"))
        },
        use_cng: { all(target_os = "windows", not(feature = "prefer-rust-impl")) },
        use_rust_crypto: { not(any(use_common_crypto, use_cng)) },
    }
}
