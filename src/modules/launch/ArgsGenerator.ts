import { GameProfile } from "../profile/GameProfile";
import { Trio } from "../commons/Collections";
import { MinecraftContainer } from "../container/MinecraftContainer";
import {
  ALICORN_SEPARATOR,
  ALICORN_VERSION_TYPE,
  FILE_SEPARATOR,
  LAUNCHER_NAME,
  LAUNCHER_VERSION,
  MOJANG_USER_TYPE,
} from "../commons/Constants";
import { isNull } from "../commons/Null";
import { getBoolean } from "../config/ConfigSupport";

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
  vMap.set("auth_session", authData.getSecondValue()); // Pre 1.6
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
  let usingLibs: string[] = [];
  const nativesLibs: string[] = [];
  for (const l of profile.libraries) {
    if (!l.canApply()) {
      continue;
    }
    const tPath = l.artifact.path.trim();
    if (tPath !== "") {
      const lb = container.getLibraryPath(tPath);
      if (!usingLibs.includes(lb)) {
        usingLibs.push(lb);
      }
    }
    if (l.isNative) {
      const nlb = container.getNativeLibraryExtractedRoot(l);
      if (!nativesLibs.includes(nlb)) {
        nativesLibs.push(nlb);
      }
    }
  }
  // Specialize for 'client.jar'
  if (!isNull(profile.clientArtifacts)) {
    usingLibs = usingLibs.concat(
      profile.clientArtifacts.map((a) => {
        return a.path;
      })
    );
  }

  nativesLibs.push("");
  usingLibs.push("");
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
  if (!isNull(tArg) && !getBoolean("cmc.disable-log4j-config")) {
    logArgs.push(tArg);
  }

  staticArgs = staticArgs.concat(logArgs).concat(profile.mainClass);
  return applyVars(vMap, staticArgs);
}

function applyVars(map: Map<string, string>, str: string[]): string[] {
  let dt = str.join(ALICORN_SEPARATOR);

  for (const [k, v] of map.entries()) {
    dt = dt.replace("${" + k + "}", v);
  }

  return dt.split(ALICORN_SEPARATOR);
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
export function applyResolution(width?: number, height?: number): string[] {
  const s = [];
  // Cannot use 'isNull' because TS doesn't know
  if (width !== undefined && width !== null && !isNaN(width) && width > 0) {
    s.push("--width", width.toString());
  }
  if (height !== undefined && width !== null && !isNaN(height) && height > 0) {
    s.push("--height", height.toString());
  }
  return s;
}

// Authlib Injector
export function applyAJ(
  ajPath: string,
  verifyHost: string,
  prefetch: string
): string[] {
  const tPath = ajPath.trim();
  const vHost = verifyHost.trim();
  if (isNull(tPath) || isNull(vHost) || isNull(prefetch)) {
    return [];
  }
  // Prefetch is essential
  return [
    `-javaagent:${tPath}=${vHost}`,
    `-Dauthlibinjector.yggdrasil.prefetched=${prefetch}`,
  ];
}

// Nide8
// NEVER EVER APPLY THIS TOGETHER WITH AUTHLIB INJECTOR!!
export function applyND(ndPath: string, serverId: string): string[] {
  const tPath = ndPath.trim();
  const sid = serverId.trim();
  if (isNull(tPath) || isNull(sid)) {
    return [];
  }
  // Nide8 has not prefetch, that's good!
  return [`-javaagent:${tPath}=${sid}`, "-Dnide8auth.client=true"];
}
