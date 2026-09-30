//! Utilities for dealing with various representations.

/// Compares a fixed-size array of `data` with an expected hex representation.
pub fn compare_bin_hex<const N: usize>(data: &[u8; N], hex: &str) -> bool {
    faster_hex::hex_decode(hex.as_bytes(), &mut [0u8; N]).is_ok_and(|decoded| decoded == data)
}

/// Writes a fixed-size array of `data` as hex into `writer`.
pub fn fmt_bin_hex<const N: usize>(
    data: &[u8; N],
    writer: &mut impl core::fmt::Write,
) -> core::fmt::Result {
    let mut out = [[0u8; 2]; N];
    let hex =
        faster_hex::hex_encode(data, out.as_flattened_mut()).expect("Hex buffer size should match");
    writer.write_str(hex)
}
