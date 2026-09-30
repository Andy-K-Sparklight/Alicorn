//! Integrity kit for content verification.

use std::str::FromStr;

mod cccrypt;
mod cng;
mod rust;

/// A hasher which digests data and compares/emits a hash value.
#[static_dispatch::setup]
pub trait HashProvider {
    /// Appends `data` to the message being hashed.
    fn update(&mut self, data: &[u8]);

    /// Consumes this hasher and compares its digest with `hex`.
    ///
    /// Returns `false` if `hex` is malformed or has the wrong length.
    fn digest_compare_hex(self, hex: &str) -> bool;

    /// Digests this hasher, encodes the output as lowercase hex value, and
    /// formats it into `writer`.
    fn digest_fmt_hex(self, writer: &mut impl core::fmt::Write) -> core::fmt::Result;
}

/// A hash algorithm.
#[derive(Copy, Clone)]
pub enum HashAlgo {
    Sha1,
    Sha256,
    Sha512,
}

macro_rules! match_algo_by_name {
    (
        $v:expr;
        $(
            $($st:expr),+ => $algo:expr
        )*
    ) => {
        match $v {
            $(
                s if $(s.eq_ignore_ascii_case($st)) || + => Some($algo),
            )*
            _ => None
        }
    };
}

impl FromStr for HashAlgo {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match_algo_by_name!(s;
          "sha1", "sha-1" => Self::Sha1
          "sha256", "sha-256" => Self::Sha256
          "sha512", "sha-512" => Self::Sha512
        )
        .ok_or(())
    }
}

/// Requests a [`HashProvider`] of the given [`HashAlgo`].
pub fn hasher_of(algo: HashAlgo) -> impl HashProvider {
    cfg_select! {
        use_rust_crypto => rust::AnyRustHasher::of(algo),
        use_common_crypto => cccrypt::AnyAppleHasher::of(algo),
        use_cng => cng::AnyWindowsHasher::of(algo),
        _ => compile_error!("No hash backend available"),
    }
}

#[cfg(test)]
mod tests {
    use super::HashAlgo;
    use super::HashProvider;
    use super::hasher_of;

    const DATA: &[u8] = b"abc";
    const MALFORMED: &str = "zz";

    struct Fixture {
        algo: HashAlgo,
        correct: &'static str,
        incorrect: &'static str,
    }

    const FIXTURES: [Fixture; 3] = [
        Fixture {
            algo: HashAlgo::Sha1,
            correct: "a9993e364706816aba3e25717850c26c9cd0d89d",
            incorrect: "cb4cc28df0fdbe0ecf9d9662e294b118092a5735",
        },
        Fixture {
            algo: HashAlgo::Sha256,
            correct: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            incorrect: "a52d159f262b2c6ddb724a61840befc36eb30c88877a4030b65cbe86298449c9"  ,
        },
        Fixture {
            algo: HashAlgo::Sha512,
            correct: "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
            incorrect: "1a9840c27a5cf22dab060cdd8a83da2b0fbcb1aeb52d4f9d3894b639083e205a5ab3f6afaeeb21b8e99b5e0fe93daafaabeef274da5d6eadcc9db36e5b6f64c4",
        },
    ];

    /// The selected backend accepts the known digest for each algorithm.
    #[test]
    fn accept_correct() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            assert!(
                hasher.digest_compare_hex(fixture.correct),
                "Digest should match",
            );
        }
    }

    /// The selected backend formats each algorithm's known digest as lowercase
    /// hex.
    #[test]
    fn format_correctly() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            let mut out = String::new();
            hasher
                .digest_fmt_hex(&mut out)
                .expect("Hash should be written");
            assert_eq!(out, fixture.correct, "Hash hex should match");
        }
    }

    /// The selected backend rejects a valid, same-length digest of different
    /// data.
    #[test]
    fn reject_incorrect() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            assert!(
                !hasher.digest_compare_hex(fixture.incorrect),
                "Expected digest {} to differ",
                fixture.incorrect,
            );
        }
    }

    /// The selected backend rejects the same malformed hex value for every
    /// algorithm.
    #[test]
    fn reject_malformed() {
        for fixture in FIXTURES {
            let mut hasher = hasher_of(fixture.algo);
            hasher.update(DATA);
            assert!(
                !hasher.digest_compare_hex(MALFORMED),
                "Malformed hex should be rejected",
            );
        }
    }
}
