// Linkage with Alicorn ToGo (https://github.com/Andy-K-Sparklight/AlicornToGo)

import { readdir, readFile, remove } from "fs-extra";
import os from "os";
import path from "path";
import {
    MANIFEST_FILE,
    MMC_PACK,
    PACK_META
} from "../../modules/pff/modpack/InstallModpack";
import { jumpTo, triggerSetPage } from "../GoTo";
// ToGo will place a hook file at ~/alicorn-to-go-hook
const HOOK_NAME = "alicorn-to-go-hook";

export async function loadToGoHook(): Promise<string> {
    try {
        return (await readFile(path.join(os.homedir(), HOOK_NAME))).toString();
    } catch {
        return "";
    }
}

async function removeToGoHook(): Promise<void> {
    try {
        await remove(path.join(os.homedir(), HOOK_NAME));
    } catch {}
}

export async function checkToGoAndDecideJump(): Promise<void> {
    const s = await loadToGoHook();
    if (s.length > 0) {
        console.log("Hook loaded!");
        const pt = path.dirname(s);
        const d = await readdir(pt);
        if (
            d.includes(MANIFEST_FILE) ||
            d.includes(MMC_PACK) ||
            d.includes(PACK_META)
        ) {
            // If really is a pack
            window.dispatchEvent(new CustomEvent("closeTips"));
            jumpTo(`/ContainerManager/${encodeURIComponent(pt)}/1`);
            triggerSetPage("ContainerManager");
        }
        await removeToGoHook();
    }
}
