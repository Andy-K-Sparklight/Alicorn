//! Asynchronous file hashing for JavaScript callers.

use std::path::PathBuf;

use napi::Env;
use napi::Task;
use napi::bindgen_prelude::AsyncTask;
use napi_derive::napi;

/// An asynchronous file-hashing operation.
pub struct HashTask {
    path: PathBuf,
    algorithm: String,
}

impl Task for HashTask {
    type Output = String;
    type JsValue = String;

    fn compute(&mut self) -> napi::Result<Self::Output> {
        crate::util::hash::hash_file(&self.path, &self.algorithm)
            .map_err(|error| napi::Error::from_reason(error.to_string()))
    }

    fn resolve(&mut self, _: Env, output: Self::Output) -> napi::Result<Self::JsValue> {
        Ok(output)
    }
}

/// Returns the hash of `path` asynchronously as lowercase hexadecimal.
///
/// Accepts `sha1` and `sha-1`, ignoring ASCII case.
///
/// The promise rejects if the algorithm is unsupported or the file cannot be
/// opened or read.
#[napi]
pub fn hash_file(path: String, algorithm: String) -> AsyncTask<HashTask> {
    AsyncTask::new(HashTask {
        path: path.into(),
        algorithm,
    })
}
