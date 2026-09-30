//! Asynchronous LZMA decompression.

use std::path::PathBuf;

use napi::threadsafe_function::ThreadsafeFunction;
use napi::threadsafe_function::ThreadsafeFunctionCallMode;
use napi_derive::napi;

#[napi]
pub struct LzmaInflatePoolHandle {
    pool: rayon::ThreadPool,
}

#[napi]
impl LzmaInflatePoolHandle {
    /// Creates an LZMA decompression worker pool with specified number of
    /// threads.
    #[napi(constructor)]
    pub fn new(threads: Option<u32>) -> napi::Result<Self> {
        let threads = threads
            .and_then(|it| it.max(1).try_into().ok())
            .unwrap_or_else(default_thread_count);

        let pool = rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build()
            .map_err(|error| napi::Error::from_reason(error.to_string()))?;

        Ok(Self { pool })
    }

    /// Decompresses the LZMA file at `src` into `dst` on a dedicated pool.
    ///
    /// Creates missing parent directories and overwrites an existing `dst`.
    ///
    /// Publishes completed output atomically. Other hard links to `dst` retain
    /// their contents.
    ///
    /// Completion is reported through the error-first `callback`, independently
    /// of this function's return. Releasing the pool handle does not cancel
    /// work.
    ///
    /// Decompression and filesystem failures are reported through `callback`.
    /// Failed operations leave `dst` unchanged.
    #[napi]
    pub fn inflate(
        &self,
        src: String,
        dst: String,
        callback: ThreadsafeFunction<(), ()>,
    ) -> napi::Result<()> {
        let src = PathBuf::from(src);
        let dst = PathBuf::from(dst);

        self.pool.spawn(move || {
            let result = alicorn_r::util::archive::lzma::inflate(&src, &dst)
                .map(|_| ())
                .map_err(Into::into);

            // Result delivery is important, don't mind waiting here
            callback.call(result, ThreadsafeFunctionCallMode::Blocking);
        });

        Ok(())
    }
}

/// Returns the default number of workers for a dedicated decompression pool.
fn default_thread_count() -> usize {
    std::thread::available_parallelism()
        .map(usize::from)
        .unwrap_or(1)
}
