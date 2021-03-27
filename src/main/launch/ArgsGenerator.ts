import { GameProfile } from "../profile/GameProfile";
import { Trio } from "../commons/Collections";
import { MinecraftContainer } from "../container/MinecraftContainer";
import os from "os";
import { isNull } from "../profile/InheritedProfileAdaptor";
import path from "path";

const ALICORN_VERSION_TYPE = "Alicorn";
const MOJANG_USER_TYPE = "mojang";
const LAUNCHER_NAME = "Alicorn";
const LAUNCHER_VERSION = "Rainbow";
const VERSIONS_ROOT = "versions";
const FILE_SEPARATOR = os.platform() === "win32" ? ";" : ":";
export const SPACE = " ";

// Generate game arguments
export function generateGameArgs(
  profile: GameProfile,
  container: MinecraftContainer,
  authData: Trio<string, string, string>
): string {
  const vMap = new Map<string, string>();
  vMap.set("version_name", wrap(profile.id));
  vMap.set("game_directory", wrap(container.rootDir));
  vMap.set("auth_player_name", wrap(authData.getFirstValue()));
  vMap.set("assets_root", wrap(container.getAssetsRoot()));
  vMap.set("assets_index_name", profile.assetIndex.id);
  vMap.set("auth_uuid", authData.getThirdValue());
  vMap.set("auth_access_token", authData.getSecondValue());
  vMap.set("user_type", MOJANG_USER_TYPE);
  vMap.set("version_type", ALICORN_VERSION_TYPE);
  return applyVars(vMap, profile.gameArgs.join(SPACE));
}

// Generate vm arguments, not for GCs or anything else
export function generateVMArgs(
  profile: GameProfile,
  container: MinecraftContainer
): string {
  const vMap = new Map<string, string>();
  vMap.set("launcher_name", LAUNCHER_NAME);
  vMap.set("launcher_version", LAUNCHER_VERSION);
  const usingLibs: string[] = [];
  const nativesLibs: string[] = [];
  for (const l of profile.libraries) {
    if (!l.canApply()) {
      continue;
    }
    const tPath = l.artifact.path.trim();
    if (tPath !== "") {
      usingLibs.push(container.getLibraryPath(tPath));
    }
    if (l.isNative) {
      nativesLibs.push(container.getNativeLibraryExtractedRoot(l));
    }
  }
  // Specialize for 'client.jar'
  if (!isNull(profile.clientArtifact)) {
    usingLibs.push(
      container.resolvePath(
        path.join(VERSIONS_ROOT, profile.clientArtifact.path)
      )
    );
  }

  // All natives directories put together
  vMap.set("natives_directory", wrap(nativesLibs.join(FILE_SEPARATOR)));

  // All class paths put together
  vMap.set("classpath", wrap(usingLibs.join(FILE_SEPARATOR)));

  // Log4j argument
  vMap.set("path", wrap(container.getLog4j2FilePath(profile.logFile.path)));

  let staticArgs: string[] = [];
  for (const a of profile.jvmArgs) {
    if (a.rules.judge()) {
      staticArgs = staticArgs.concat(a.value);
    }
  }
  staticArgs = staticArgs.concat(profile.mainClass);
  return applyVars(vMap, staticArgs.join(SPACE));
}

// Add quotes
function wrap(strIn: string): string {
  if (!(strIn.startsWith('"') && strIn.endsWith('"'))) {
    return '"' + strIn + '"';
  }
  return strIn;
}

function applyVars(map: Map<string, string>, str: string): string {
  for (const [k, v] of map.entries()) {
    str = str.replace("${" + k + "}", v);
  }
  return str;
}

// Add a server to join in directly
export function useServer(connection: string): string {
  const sp = connection.split(":");
  const svHost = sp[0];
  const port = sp[1] || "25565";
  return `--server ${svHost} --port ${port}`;
}

// Add a custom resolution
export function useResolution(width: number, height: number): string {
  const s = [];
  if (!isNaN(width) && width > 0) {
    s.push(`--width ${width}`);
  }
  if (!isNaN(height) && height > 0) {
    s.push(`--height ${height}`);
  }
  return s.join(SPACE);
}

// Authlib Injector
export function useAJ(ajPath: string, verifyHost: string): string {
  return `-javaagent:${wrap(ajPath)}=${verifyHost}`;
  // To be honest, we want to show 'Alicorn' rather than the name of the auth server
  // But since some servers auth their players by reading this value('--versionType')
  // We should let this off
  // return `-javaagent:${wrap(ajPath)}=${verifyHost} -Dauthlibinjector.noShowServerName`
}
