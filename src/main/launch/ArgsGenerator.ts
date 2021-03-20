import { StandardProfile } from "../profile/StandardProfile";
import { Trio } from "../commons/Collections";
import { MinecraftContainer } from "../container/MinecraftContainer";
import os from "os";

const ALICORN_VERSION_TYPE = "Alicorn";
const MOJANG_USER_TYPE = "mojang";
const LAUNCHER_NAME = "Alicorn";
const LAUNCHER_VERSION = "Rainbow";
const FILE_SEPARATOR = os.platform() === "win32" ? ";" : ":";
const SPACE = " ";

// Generate static arguments, including jvm and game, but not GCs or something else
// Append a java executable before it to start a game
export function generateStaticArgs(
  profile: StandardProfile,
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
  vMap.set("natives_directory", wrap(container.getNativesRoot(profile.id)));
  vMap.set("launcher_name", LAUNCHER_NAME);
  vMap.set("launcher_version", LAUNCHER_VERSION);
  const usingLibs: string[] = [];
  for (const l of profile.libraries) {
    const tPath = l.artifact.path.trim();
    if (tPath !== "" && l.canApply()) {
      usingLibs.push(container.getLibraryPath(tPath));
    }
  }
  // Specialize for 'client.jar'
  usingLibs.push(container.getClientJarPath(profile.id));

  vMap.set("classpath", wrap(usingLibs.join(FILE_SEPARATOR)));
  vMap.set("path", wrap(container.getLog4j2FilePath(profile.logFile.path)));

  let staticArgs: string[] = [];
  for (const a of profile.jvmArgs) {
    if (a.rules.judge()) {
      staticArgs = staticArgs.concat(a.value);
    }
  }
  staticArgs = staticArgs.concat(profile.mainClass).concat(profile.gameArgs);
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

// Apply java to args
export function applyJava(jPath: string, args: string): string {
  return wrap(jPath) + SPACE + args;
}
