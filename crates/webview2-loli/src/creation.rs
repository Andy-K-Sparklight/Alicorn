use core::ffi::c_void;
use std::path::Path;

use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler;
use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2EnvironmentOptions;
use windows::Win32::System::LibraryLoader::GetProcAddress;
use windows::Win32::System::LibraryLoader::LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR;
use windows::Win32::System::LibraryLoader::LOAD_LIBRARY_SEARCH_SYSTEM32;
use windows::Win32::System::LibraryLoader::LoadLibraryA;
use windows::Win32::System::LibraryLoader::LoadLibraryExW;
use windows::core::HRESULT;
use windows::core::Interface;
use windows::core::PCWSTR;
use windows::core::s;

use crate::discovery::query_evergreen_lib;
use crate::error::LoliError;
use crate::util::encode_absolute_path;

/// ```cpp
/// public STDAPI CreateWebViewEnvironmentWithOptionsInternal(
///     bool checkRunningInstance,
///     int runtimeType,
///     PCWSTR userDataFolder,
///     IUnknown* environmentOptions,
///     ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler* webViewEnvironmentCreatedHandler
/// )
/// ```
type CreateWebViewEnvironmentWithOptionsInternal =
    unsafe extern "system" fn(bool, i32, PCWSTR, *mut c_void, *mut c_void) -> HRESULT;

/// ```cpp
/// public STDAPI CreateCoreWebView2EnvironmentWithOptions(
///     PCWSTR browserExecutableFolder,
///     PCWSTR userDataFolder,
///     ICoreWebView2EnvironmentOptions* environmentOptions,
///     ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler* environment_created_handler
/// )
/// ```
type CreateCoreWebView2EnvironmentWithOptions =
    unsafe extern "system" fn(PCWSTR, PCWSTR, *mut c_void, *mut c_void) -> HRESULT;

/// Locates the WebView2 library, loads it, then invokes the entrypoint using
/// the supplied arguments.
///
/// If `allow_official_loader` is `true`, and `WebView2Loader.dll` can be loaded
/// via `LoadLibraryA`, then its `CreateWebViewEnvironmentWithOptions` export is
/// used. If the loader can't be loaded, or `allow_official_loader` is `false`,
/// this method falls back to its own resolution strategy, by locating the
/// `EmbeddedBrowserWebView.dll` and invoke its
/// `CreateWebViewEnvironmentWithOptionsInternal` export. Under this strategy,
/// only Evergreen installations will be picked up, and no environment variables
/// can be used to control the loader behavior.
///
/// The module is not unloaded.
///
/// # Safety
///
/// This method passes the `user_data_dir` (encoded), `options` and `handler` to
/// `CreateWebViewEnvironmentWithOptions` or
/// `CreateWebViewEnvironmentWithOptionsInternal` as-is, with at most wrappers
/// that do not affect their lifetimes. Thus, safety requirements of these
/// functions are inherited.
pub unsafe fn create_environment(
    allow_official_loader: bool,
    user_data_dir: &Path,
    options: Option<&ICoreWebView2EnvironmentOptions>,
    handler: &ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler,
) -> Result<(), LoliError> {
    if allow_official_loader && let Some(create_env) = unsafe { load_official() } {
        let dir = encode_absolute_path(user_data_dir)?;
        unsafe {
            return create_env(
                PCWSTR::null(),
                PCWSTR(dir.as_ptr()),
                options.map_or(core::ptr::null_mut(), Interface::as_raw),
                handler.as_raw(),
            )
            .ok()
            .map_err(Into::into)
        }
    }

    let path = query_evergreen_lib().ok_or(LoliError::NoRuntime)?;
    unsafe { load_start(&path, 0, user_data_dir, options, handler) }
}

/// Similar to [`create_environment`], but loads the DLL denoted by `path`
/// instead.
///
/// # Safety
///
/// Same as [`create_environment`], except that the compatibility requirements
/// target the supplied DLL instead of the system-installed one.
pub unsafe fn create_environment_from_path(
    path: &Path,
    user_data_dir: &Path,
    options: Option<&ICoreWebView2EnvironmentOptions>,
    handler: &ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler,
) -> Result<(), LoliError> {
    unsafe { load_start(path, -1, user_data_dir, options, handler) }
}

/// Custom discovery & start path. Loads the DLL at `path`, and pass the rest of
/// the arguments to its `CreateWebViewEnvironmentWithOptionsInternal` export.
unsafe fn load_start(
    path: &Path,
    kind: i32,
    directory: &Path,
    options: Option<&ICoreWebView2EnvironmentOptions>,
    handler: &ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler,
) -> Result<(), LoliError> {
    let directory = encode_absolute_path(directory)?;
    unsafe {
        let create_env_internal = load(path)?;

        create_env_internal(
            true,
            kind,
            PCWSTR(directory.as_ptr()),
            options.map_or(core::ptr::null_mut(), Interface::as_raw),
            handler.as_raw(),
        )
        .ok()
        .map_err(Into::into)
    }
}

/// Attempts to load `CreateCoreWebView2EnvironmentWithOptions` via
/// `WebView2Loader.dll`.
unsafe fn load_official() -> Option<CreateCoreWebView2EnvironmentWithOptions> {
    let module = unsafe { LoadLibraryA(s!("WebView2Loader.dll")) }.ok()?;
    let address =
        unsafe { GetProcAddress(module, s!("CreateCoreWebView2EnvironmentWithOptions")) }?;
    Some(unsafe {
        core::mem::transmute::<
            unsafe extern "system" fn() -> isize,
            CreateCoreWebView2EnvironmentWithOptions,
        >(address)
    })
}

/// Loads `EmbeddedBrowserWebView.dll` from `path` and returns the
/// `CreateWebViewEnvironmentWithOptionsInternal` symbol.
unsafe fn load(path: &Path) -> Result<CreateWebViewEnvironmentWithOptionsInternal, LoliError> {
    let native_path = encode_absolute_path(path)?;
    let module = unsafe {
        LoadLibraryExW(
            &native_path,
            None,
            LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_SYSTEM32,
        )
    }
    .map_err(|source| LoliError::LoadLib {
        path: path.to_owned(),
        source,
    })?;
    let address =
        unsafe { GetProcAddress(module, s!("CreateWebViewEnvironmentWithOptionsInternal")) }
            .ok_or_else(|| LoliError::NoSymbol {
                symbol: "CreateWebViewEnvironmentWithOptionsInternal".into(),
            })?;

    Ok(unsafe {
        core::mem::transmute::<
            unsafe extern "system" fn() -> isize,
            CreateWebViewEnvironmentWithOptionsInternal,
        >(address)
    })
}
