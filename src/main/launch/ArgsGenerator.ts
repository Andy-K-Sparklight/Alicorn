import { GameProfile } from "../profile/GameProfile";
import { Trio } from "../commons/Collections";
import { MinecraftContainer } from "../container/MinecraftContainer";
import path from "path";
import {
  ALICORN_TEMP_SEPARATOR,
  ALICORN_VERSION_TYPE,
  FILE_SEPARATOR,
  LAUNCHER_NAME,
  LAUNCHER_VERSION,
  MOJANG_USER_TYPE,
  VERSIONS_ROOT,
} from "../commons/Constants";
import { isNull } from "../commons/Null";

// Generate game arguments
export function generateGameArgs(
  profile: GameProfile,
  container: MinecraftContainer,
  authData: Trio<string, string, string>
): string[] {
  const vMap = new Map<string, string>();
  vMap.set("version_name", profile.id);
  vMap.set("game_directory", container.rootDir);
  vMap.set("auth_player_name", authData.getFirstValue());
  vMap.set("assets_root", container.getAssetsRoot());
  vMap.set("assets_index_name", profile.assetIndex.id);
  vMap.set("auth_uuid", authData.getThirdValue());
  vMap.set("auth_access_token", authData.getSecondValue());
  vMap.set("user_type", MOJANG_USER_TYPE);
  vMap.set("version_type", ALICORN_VERSION_TYPE);
  return applyVars(vMap, profile.gameArgs);
}

// Generate vm arguments, not for GCs or anything else
export function generateVMArgs(
  profile: GameProfile,
  container: MinecraftContainer
): string[] {
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
  vMap.set("natives_directory", nativesLibs.join(FILE_SEPARATOR));

  // All class paths put together
  vMap.set("classpath", usingLibs.join(FILE_SEPARATOR));

  // Log4j argument
  vMap.set("path", container.getLog4j2FilePath(profile.logFile.path));

  let staticArgs: string[] = [];
  for (const a of profile.jvmArgs) {
    if (a.rules.judge()) {
      staticArgs = staticArgs.concat(a.value);
    }
  }
  const logArgs: string[] = [];
  const tArg = profile.logArg.trim();
  if (!isNull(tArg)) {
    logArgs.push(tArg);
  }
  staticArgs = staticArgs.concat(logArgs).concat(profile.mainClass);
  return applyVars(vMap, staticArgs);
}

// Add quotes
function wrap(strIn: string): string {
  if (!(strIn.startsWith('"') && strIn.endsWith('"'))) {
    return '"' + strIn + '"';
  }
  return strIn;
}

function applyVars(map: Map<string, string>, str: string[]): string[] {
  let dt = str.join(ALICORN_TEMP_SEPARATOR);

  for (const [k, v] of map.entries()) {
    dt = dt.replace("${" + k + "}", v);
  }

  return dt.split(ALICORN_TEMP_SEPARATOR);
}

// Add a server to join in directly
export function applyServer(connection: string): string[] {
  if (isNull(connection.trim())) {
    return [];
  }
  const sp = connection.split(":");
  const svHost = sp[0];
  const port = sp[1] || "25565";
  return ["--server", svHost, "--port", port];
}

// Add a custom resolution
export function applyResolution(width: number, height: number): string[] {
  const s = [];
  if (!isNaN(width) && width > 0) {
    s.push(`--width ${width}`);
  }
  if (!isNaN(height) && height > 0) {
    s.push(`--height ${height}`);
  }
  return s;
}

// Authlib Injector
export function applyAJ(ajPath: string, verifyHost: string): string[] {
  const tPath = ajPath.trim();
  const vHost = verifyHost.trim();
  if (isNull(tPath) || isNull(vHost)) {
    return [];
  }
  return [`-javaagent:${wrap(tPath)}=${vHost}`];
  // To be honest, we want to show 'Alicorn' rather than the name of the auth server
  // But since some servers auth their players by reading this value('--versionType')
  // We should let this off
  // return `-javaagent:${wrap(ajPath)}=${verifyHost} -Dauthlibinjector.noShowServerName`
}
