// For Quilt, we only needs to download profile and that's all.

import { copy } from "fs-extra";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { xgot } from "../../download/GotWrapper";
import { downloadProfile } from "./MojangCore";

const QUILT_ROOT = "https://meta.quiltmc.org/v3/versions/loader/";

function genQuiltName(mcv: string, ld: string): string {
  return `quilt-loader-${ld}-${mcv}`;
}

export async function getQuiltProfile(
  mcv: string,
  c: MinecraftContainer
): Promise<boolean> {
  try {
    const loaders = await xgot(QUILT_ROOT + mcv);
    const loaderName = (loaders as Array<{ loader: { version: string } }>)[0]
      .loader.version;
    const ver = genQuiltName(mcv, loaderName);
    await downloadProfile(
      QUILT_ROOT + mcv + "/" + loaderName + "/profile/json",
      c,
      ver
    );
    await copy(c.getClientPath(mcv), c.getClientPath(ver)); // Yeah, that's all, quite easy.
    return true;
  } catch {
    return false;
  }
}
