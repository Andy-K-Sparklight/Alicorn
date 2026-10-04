//! Integrity based on CNG on Windows 10+.
#![cfg(use_cng)]

use windows::Win32::Security::Cryptography::BCRYPT_HASH_HANDLE;
use windows::Win32::Security::Cryptography::BCRYPT_MD5_ALG_HANDLE;
use windows::Win32::Security::Cryptography::BCRYPT_SHA1_ALG_HANDLE;
use windows::Win32::Security::Cryptography::BCRYPT_SHA256_ALG_HANDLE;
use windows::Win32::Security::Cryptography::BCRYPT_SHA512_ALG_HANDLE;
use windows::Win32::Security::Cryptography::BCryptCreateHash;
use windows::Win32::Security::Cryptography::BCryptDestroyHash;
use windows::Win32::Security::Cryptography::BCryptFinishHash;
use windows::Win32::Security::Cryptography::BCryptHashData;

use super::*;
use crate::default_new; // Including generated macros needed by static-dispatch

/// # Safety
///
/// Generated code is unsound, unless all these conditions are met:
/// - `$algo` must be a CNG algorithm pseudo-handle.
/// - `$len` must accurately describe the digest length produced by that
///   algorithm.
macro_rules! impl_hash_unchecked {
    ($name:ident, $algo:ident, $len:literal) => {
        pub struct $name(BCRYPT_HASH_HANDLE); // SAFETY: This inner handle should be immutable.

        // SAFETY: CNG hash handles has no thread affinity.
        unsafe impl Send for $name {}

        impl $name {
            fn new() -> Self {
                let mut handle = BCRYPT_HASH_HANDLE::default();
                // SAFETY: The algorithm and the handle are guaranteed to be valid.
                unsafe { BCryptCreateHash($algo, &mut handle, None, None, 0) }
                    .ok()
                    .expect("CNG hash should initialize");
                Self(handle)
            }

            fn finish(self) -> [u8; $len] {
                let mut digest = [0; $len];
                // SAFETY: This is a live, exclusively owned hash handle, and the
                // output buffer has the exact digest size for its algorithm.
                unsafe { BCryptFinishHash(self.0, &mut digest, 0) }
                    .ok()
                    .expect("CNG hash should finalize");
                digest
            }
        }

        default_new!($name);

        impl Drop for $name {
            fn drop(&mut self) {
                // SAFETY: This wrapper owns the live hash handle and destroys it
                // exactly once, also releasing CNG's hash-object storage.
                // Cleanup is best-effort so it cannot panic during unwinding.
                let _ = unsafe { BCryptDestroyHash(self.0) };
            }
        }

        impl HashProvider for $name {
            fn update(&mut self, data: &[u8]) {
                for chunk in data.chunks(u32::MAX as usize) {
                    // SAFETY: Handle is immutable and chunk size fits.
                    // Note: The chunk size is bounded to `ULONG`, which is `u32::MAX`.
                    unsafe { BCryptHashData(self.0, chunk, 0) }
                        .ok()
                        .expect("CNG hash should be updated");
                }
            }

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

// SAFETY: All algorithms match their length.
impl_hash_unchecked!(Md5, BCRYPT_MD5_ALG_HANDLE, 16);
impl_hash_unchecked!(Sha1, BCRYPT_SHA1_ALG_HANDLE, 20);
impl_hash_unchecked!(Sha256, BCRYPT_SHA256_ALG_HANDLE, 32);
impl_hash_unchecked!(Sha512, BCRYPT_SHA512_ALG_HANDLE, 64);

/// A CNG hasher selected by algorithm.
#[static_dispatch::setup]
pub enum AnyWindowsHasher {
    Md5(Md5),
    Sha1(Sha1),
    Sha256(Sha256),
    Sha512(Sha512),
}

impl AnyWindowsHasher {
    /// Creates an empty CNG hasher for `algo`, panicking if initialization
    /// fails.
    pub fn of(algo: HashAlgo) -> Self {
        match algo {
            HashAlgo::Md5 => Self::Md5(Md5::new()),
            HashAlgo::Sha1 => Self::Sha1(Sha1::new()),
            HashAlgo::Sha256 => Self::Sha256(Sha256::new()),
            HashAlgo::Sha512 => Self::Sha512(Sha512::new()),
        }
    }
}

static_dispatch::implementation!(HashProvider for AnyWindowsHasher);
