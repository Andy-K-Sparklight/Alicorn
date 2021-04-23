import os from "os";
import pkg from "../../../package.json";

export const ALICORN_VERSION_TYPE = "Alicorn";
export const MOJANG_USER_TYPE = "mojang";
export const LAUNCHER_NAME = "Alicorn";
export const LAUNCHER_VERSION = pkg.version;
export const FILE_SEPARATOR = os.platform() === "win32" ? ";" : ":";
export const SPACE = " ";
export const ALICORN_SEPARATOR = "\u2764\u2764";
export const PROCESS_END_GATE = "END";
export const PROCESS_LOG_GATE = "LOG";
// Stands for 'Alicorn Data'
export const ALICORN_DATA_SUFFIX = ".ald";
// Stands for 'Alicorn Pinkie Promise'
export const ALICORN_ENCRYPTED_DATA_SUFFIX = ".alpp";

export const MOJANG_VERSIONS_MANIFEST =
  "https://launchermeta.mojang.com/mc/game/version_manifest.json";

export const FORGE_MAVEN_ROOT = "https://files.minecraftforge.net/maven";
export const FORGE_VERSIONS_MANIFEST = `${FORGE_MAVEN_ROOT}/net/minecraftforge/forge/promotions_slim.json`;

export const FABRIC_META_ROOT = "https://meta.fabricmc.net/v2";

// MD5 of the following text (excluding quotes): "The developer of Alicorn Launcher is really a cute filly!"
export const CODE_32_SPECIAL = "61096da20861084f1e6a442d939717a8";

enum ReleaseType {
  RELEASE = "release",
  SNAPSHOT = "snapshot",
  OLD_ALPHA = "old_alpha",
  OLG_BETA = "old_beta",
  MODIFIED = "modified", // Nonofficial profiles
}

export { ReleaseType };

export const PLACE_HOLDER = "#//!?PH>>";
