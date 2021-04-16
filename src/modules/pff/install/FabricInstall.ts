import {
  FABRIC_VERSIONS_LOADER,
  generateFabricJarName,
} from "../get/FabricGet";
import { GameProfile } from "../../profile/GameProfile";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { ensureLibraries } from "../../launch/Ensurance";
import objectHash from "object-hash";
import childProcess from "child_process";
import { makeTempLP, restoreLP } from "./ForgeInstall";
import { convertFromFabric } from "../../profile/FabricProfileAdaptor";
import { xgot } from "../../download/GotWrapper";

const JAR_ARG = "-jar";
const INSTALL_ARG =
  "client -dir ${install_dir} -mcversion ${mc_version} -loader ${loader_version}";
const PROFILE_JSON_SUFFIX = "/profile/json";

export async function performFabricInstall(
  jExecutable: string,
  fbURL: string,
  fbv: string,
  mcv: string,
  container: MinecraftContainer
): Promise<boolean> {
  try {
    let failBit = true;
    try {
      await makeTempLP(container);
      await ensureFabricLibraries(mcv, fbv, container);
      await bootFabricInstaller(jExecutable, fbURL, fbv, mcv, container);
    } catch {
      failBit = false;
    } finally {
      await restoreLP(container);
    }
    return failBit;
  } catch {
    return false;
  }
}

async function bootFabricInstaller(
  jExecutable: string,
  fbURL: string,
  fbv: string,
  mcv: string,
  container: MinecraftContainer
) {
  const fArg = INSTALL_ARG.replace("${install_dir}", container.resolvePath())
    .replace("${mc_version}", mcv)
    .replace("${loader_version}", fbv)
    .split(" ");
  const fbJar = container.getTempFileStorePath(
    generateFabricJarName(objectHash(fbURL).slice(0, 8))
  );
  return new Promise<void>((resolve, reject) => {
    const prc = childProcess.spawn(jExecutable, [JAR_ARG, fbJar].concat(fArg), {
      cwd: container.resolvePath(),
    });
    prc.on("close", (code) => {
      if (code === 0) {
        resolve();
      }
      reject();
    });
    prc.on("error", () => {
      prc.kill("SIGKILL");
      reject();
    });
  });
}

async function ensureFabricLibraries(
  mcv: string,
  fbv: string,
  container: MinecraftContainer
): Promise<void> {
  const url = FABRIC_VERSIONS_LOADER + `/${mcv}/${fbv}` + PROFILE_JSON_SUFFIX;
  try {
    const profJ = await xgot(url);
    const gp = new GameProfile(convertFromFabric(Object.assign({}, profJ)));
    await ensureLibraries(gp, container);
  } catch {
    return;
  }
}
