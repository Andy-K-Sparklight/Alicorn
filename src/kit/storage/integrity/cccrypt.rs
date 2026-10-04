//! Integrity using Common Crypto on Apple devices.
#![cfg(use_common_crypto)]

use common_crypto::hash::MD5;
use common_crypto::hash::SHA1;
use common_crypto::hash::SHA256;
use common_crypto::hash::SHA512;

use super::*; // Including generated macros needed by static-dispatch

macro_rules! impl_hash {
    ($name:ty) => {
        impl super::HashProvider for $name {
            fn update(&mut self, data: &[u8]) { self.update(data) }

            fn digest_with<R>(self, consume: impl FnOnce(&mut [u8]) -> R) -> R {
                consume(&mut self.finish())
            }

            fn digest_compare_hex(self, hex: &str) -> bool {
                crate::util::repr::compare_bin_hex(&self.finish(), hex)
            }

            fn digest_fmt_hex(self, writer: &mut impl core::fmt::Write) -> core::fmt::Result {
                crate::util::repr::fmt_bin_hex(&self.finish(), writer)
            }
        }
    };
}

impl_hash!(MD5);
impl_hash!(SHA1);
impl_hash!(SHA256);
impl_hash!(SHA512);

/// A CommonCrypto hasher selected by algorithm.
#[static_dispatch::setup]
pub enum AnyAppleHasher {
    Md5(MD5),
    Sha1(SHA1),
    Sha256(SHA256),
    Sha512(SHA512),
}

impl AnyAppleHasher {
    /// Creates an empty CommonCrypto hasher for `algo`.
    pub fn of(algo: HashAlgo) -> Self {
        match algo {
            HashAlgo::Md5 => Self::Md5(MD5::new()),
            HashAlgo::Sha1 => Self::Sha1(SHA1::new()),
            HashAlgo::Sha256 => Self::Sha256(SHA256::new()),
            HashAlgo::Sha512 => Self::Sha512(SHA512::new()),
        }
    }
}

static_dispatch::implementation!(HashProvider for AnyAppleHasher);
