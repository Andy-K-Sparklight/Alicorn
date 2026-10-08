//! Template string processing.

use std::collections::HashMap;

use napi_derive::napi;

#[napi]
pub fn interpret_ts(input: String, values: HashMap<String, String>) -> String {
    alicorn_r::util::ts::interpret_ts(input, |key| values.get(key)).into_owned()
}
