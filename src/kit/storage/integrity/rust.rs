//! Self-contained integrity using RustCrypto crates.
#![cfg(use_rust_crypto)]

use digest::Digest;
use md5::Md5;
use sha1::Sha1;
use sha2::Sha256;
use sha2::Sha512;

use super::*; // Including generated macros needed by static-dispatch

macro_rules! impl_hash {
    ($name:ty) => {
        impl HashProvider for $name {
            fn update(&mut self, data: &[u8]) { Digest::update(self, data); }

            fn digest_with<R>(self, consume: impl FnOnce(&mut [u8]) -> R) -> R {
                consume(&mut self.finalize())
            }

            fn digest_compare_hex(self, hex: &str) -> bool {
                crate::util::repr::compare_bin_hex(&self.finalize().0, hex)
            }

            fn digest_fmt_hex(self, writer: &mut impl core::fmt::Write) -> core::fmt::Result {
                crate::util::repr::fmt_bin_hex(&self.finalize().0, writer)
            }
        }
    };
}

impl_hash!(Md5);
impl_hash!(Sha1);
impl_hash!(Sha256);
impl_hash!(Sha512);

/// A RustCrypto hasher selected by algorithm.
#[static_dispatch::setup]
pub enum AnyRustHasher {
    Md5(Md5),
    Sha1(Sha1),
    Sha256(Sha256),
    Sha512(Sha512),
}

impl AnyRustHasher {
    /// Creates an empty RustCrypto hasher for `algo`.
    pub fn of(algo: HashAlgo) -> Self {
        match algo {
            HashAlgo::Md5 => Self::Md5(Md5::new()),
            HashAlgo::Sha1 => Self::Sha1(Sha1::new()),
            HashAlgo::Sha256 => Self::Sha256(Sha256::new()),
            HashAlgo::Sha512 => Self::Sha512(Sha512::new()),
        }
    }
}

static_dispatch::implementation!(HashProvider for AnyRustHasher);
