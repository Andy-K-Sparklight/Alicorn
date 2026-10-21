use std::path::PathBuf;

use windows_registry::CURRENT_USER;
use windows_registry::LOCAL_MACHINE;
use windows_registry::OpenOptions;

use crate::util::encode_absolute_path;

/// Finds Evergreen's registered DLL path. Tries the per-user installation
/// first, then system-wide.
///
/// See the [distribution guide] for details about these GUIDs.
///
/// [distribution guide]: https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution
pub fn query_evergreen_lib() -> Option<PathBuf> {
    const CLIENTS: &str =
        "Software\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
    const CLIENT_STATE: &str =
        "Software\\Microsoft\\EdgeUpdate\\ClientState\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";

    // The loaded symbols is consumed by the code here directly, thus its
    // architecture should match the compilation target (before possible
    // translations).
    let arch = cfg_select! {
        target_arch = "x86" => "x86",
        target_arch = "x86_64" => "x64",
        target_arch = "aarch64" => "arm64",
        _ => return None,
    };

    for (hive, set_flag) in [
        (CURRENT_USER, None),
        (LOCAL_MACHINE, Some(OpenOptions::wow64_32)), // Target the 32-bit view for HKLM
    ] {
        let mut access = hive.options();

        if let Some(set_flag) = set_flag {
            set_flag(&mut access);
        }

        let Ok(ver) = access.open(CLIENTS).and_then(|key| key.get_string("pv")) else {
            continue;
        };

        if ver.is_empty() || ver == "0.0.0.0" {
            continue;
        }
        let Ok(root) = access
            .open(CLIENT_STATE)
            .and_then(|key| key.get_hstring("EBWebView"))
        else {
            continue;
        };
        let mut root = PathBuf::from(root.to_os_string());

        // Path in the registry must be absolute, or the target path can't be defined.
        if encode_absolute_path(&root).is_err() {
            continue;
        }

        root.push("EBWebView");
        root.push(arch);
        root.push("EmbeddedBrowserWebView.dll");

        return Some(root);
    }
    None
}
