import { MinecraftContainer } from "./MinecraftContainer";
import fs from "fs-extra";
import path from "path";
import { getAllContainers, getContainer, isMounted } from "./ContainerUtil";
import { GameProfile } from "../profile/GameProfile";

export async function scanCoresIn(
  c: MinecraftContainer,
  unsafe = false
): Promise<string[]> {
  const cRoot = c.getVersionBase();
  try {
    const allV = await fs.readdir(cRoot);
    const tArr: string[] = [];
    await Promise.all(
      allV.map((v) => {
        return new Promise<void>((resolve) => {
          if (unsafe) {
            tArr.push(v);
            resolve();
            return;
          }
          isValidCore(path.join(cRoot, v)).then((i) => {
            if (i) {
              tArr.push(v);
            }
            resolve();
          });
        });
      })
    );
    return tArr;
  } catch (e) {
    throw new Error("Cannot read container. Caused by: " + e);
  }
}

async function isValidCore(profileRoot: string): Promise<boolean> {
  try {
    const v = path.basename(profileRoot);
    const expectedProfile = path.join(profileRoot, v + ".json");
    new GameProfile(await fs.readJSON(expectedProfile));
    return true;
  } catch {
    return false;
  }
}

export async function scanCoresInAllMountedContainers(
  unsafe = false
): Promise<Map<MinecraftContainer, string[]>> {
  const rMap = new Map<MinecraftContainer, string[]>();
  for (const c of getAllContainers()) {
    try {
      if (!isMounted(c)) {
        continue;
      }
      const container = getContainer(c);
      rMap.set(container, await scanCoresIn(container, unsafe));
    } catch {}
  }
  return rMap;
}
