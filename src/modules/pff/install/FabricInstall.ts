import childProcess from "child_process";
import fs from "fs-extra";
import { basicHash } from "../../commons/BasicHash";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { addDoing } from "../../download/DownloadWrapper";
import { xgot } from "../../download/GotWrapper";
import { ensureLibraries } from "../../launch/Ensurance";
import { convertFromFabric } from "../../profile/FabricProfileAdaptor";
import { GameProfile } from "../../profile/GameProfile";
import {
  FABRIC_VERSIONS_LOADER,
  generateFabricJarName,
} from "../get/FabricGet";
import { makeTempLP } from "./ForgeInstall";

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
      // Fabric has less libraries, much faster than Forge!
      await ensureFabricLibrariesOL(mcv, fbv, container);
      await bootFabricInstaller(jExecutable, fbURL, fbv, mcv, container);
      await fs.ensureDir(container.getModsRoot());
    } catch (e) {
      console.log(e);
      failBit = false;
    }
    return failBit;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function bootFabricInstaller(
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
    generateFabricJarName(basicHash(fbURL).slice(0, 8))
  );
  return new Promise<void>((resolve, reject) => {
    try {
      const prc = childProcess.spawn(
        jExecutable,
        [JAR_ARG, fbJar].concat(fArg),
        {
          cwd: container.resolvePath(),
        }
      );
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
      prc.stdout?.on("data", (d) => {
        addDoing(d.toString());
      });
      prc.stderr?.on("data", (d) => {
        addDoing(d.toString());
      });
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}

async function ensureFabricLibrariesOL(
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
