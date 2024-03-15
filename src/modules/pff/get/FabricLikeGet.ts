// For Quilt, we only needs to download profile and that's all.

import { copy } from "fs-extra";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { xgot } from "../../download/GotWrapper";
import { downloadProfile } from "./MojangCore";

const API_SUBFOLDER = "/versions/loader/";

function genFabricLikeName(type: string, mcv: string, ld: string): string {
    return `${type}-${ld}-${mcv}`;
}

export async function getFabricLikeProfile(
    root: string,
    type: string,
    mcv: string,
    c: MinecraftContainer
): Promise<boolean> {
    try {
        const loaders = await xgot(root + API_SUBFOLDER + mcv);
        const loaderName = (loaders as Array<{ loader: { version: string } }>)[0]
            .loader.version;
        const ver = genFabricLikeName(type, mcv, loaderName);
        await downloadProfile(
            root + API_SUBFOLDER + mcv + "/" + loaderName + "/profile/json",
            c,
            ver
        );
        await copy(c.getClientPath(mcv), c.getClientPath(ver)); // Yeah, that's all, quite easy.
        return true;
    } catch {
        return false;
    }
}
