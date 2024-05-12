import os from "os";
import path from "path";
import { alterPath } from "../modules/commons/FileUtil";
import { getBoolean, set } from "../modules/config/ConfigSupport";
import { createNewContainer } from "../modules/container/ContainerWrapper";
import { getTimeoutController } from "../modules/download/RainbowFetch";
import { installBothJDKs } from "../modules/java/BuiltInJDK";
import {
    getAllJava,
    getJavaInfoRaw,
    parseJavaInfo,
    parseJavaInfoRaw,
    setDefaultJavaHome
} from "../modules/java/JavaInfo";
import { whereJava } from "../modules/java/WhereJava";
import { isInstBusy, startInst } from "./Instruction";
import { checkToGoAndDecideJump, loadToGoHook } from "./linkage/AlicornToGo";
import { submitInfo, submitWarn } from "./Message";
import { tr } from "./Translator";

export function waitInstDone(): Promise<void> {
    return new Promise<void>((res) => {
        if (!isInstBusy()) {
            res();
            return;
        }
        const fun = () => {
            window.removeEventListener("InstructionEnd", fun);
            res();
        };
        window.addEventListener("InstructionEnd", fun);
    });
}

async function waitJavaSearch(): Promise<boolean> {
    const r = await whereJava(true, true);
    if (r.length > 0) {
        return true;
    }
    return false;
}

export async function completeFirstRun(): Promise<void> {
    if (!getBoolean("first-run?")) {
        await checkToGoAndDecideJump();
        return;
    }
    await configureDefaultDirs();
    await createNewContainer(
        await getMCDefaultRootDir(),
        tr("FirstRun.Default") || "Minecraft"
    );
    await decideMirror();
    await setupFirstJavaCheckAndCheckToGo();
    set("first-run?", false);
}

async function getMCDefaultRootDir(): Promise<string> {
    switch (os.platform()) {
        case "win32":
            return (
                (await alterPath(
                    path.join(
                        process.env["APPDATA"] ||
                        path.join(os.homedir(), "AppData", "Roaming"),
                        ".minecraft"
                    )
                )) || path.join(os.homedir(), ".minecraft")
            );
        case "darwin":
            return path.join(
                os.homedir(),
                "Library",
                "Application Support",
                "minecraft"
            );
        case "linux":
        default:
            return path.join(os.homedir(), ".minecraft");
    }
}

async function setupFirstJavaCheckAndCheckToGo(): Promise<void> {
    submitInfo(tr("FirstRun.Preparing"));
    let s = false;
    void (async () => {
        s = await waitJavaSearch();
    })();
    await waitInstDone();
    if (!s) {
        startInst("NoJava");
        await waitInstDone();
        submitInfo(tr("FirstRun.FetchingJava"));
        if (await installBothJDKs()) {
            submitInfo(tr("FirstRun.JavaInstalled"));
        } else {
            submitWarn(tr("FirstRun.JavaFailed"));
        }
    } else {
        startInst("JavaOK");
    }
    // Delegate this task
    void whereJava(true)
        .then(async () => {
            let a = "";
            submitInfo(tr("FirstRun.ConfiguringJava"));
            await Promise.allSettled(
                getAllJava().map(async (j) => {
                    const jf = parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(j)));
                    if (jf.rootVersion >= 17) {
                        a = j;
                    }
                })
            );
            setDefaultJavaHome(a || getAllJava()[0] || "");
            submitInfo(tr("FirstRun.JavaConfigured"));
        })
        .catch(() => {});
    await waitInstDone();
    if (await loadToGoHook()) {
        startInst("HavePack");
        await waitInstDone();
        await checkToGoAndDecideJump();
    }
}

async function configureDefaultDirs(): Promise<void> {
    const pff = await alterPath(path.join(os.homedir(), "alicorn", "pff-cache"));
    const cx = await alterPath(path.join(os.homedir(), "alicorn", "asc-cache"));
    if (pff.length > 0) {
        set("pff.cache-root", pff);
        localStorage.setItem("Edited.pff.cache-root", "1");
    }
    if (cx.length > 0) {
        set("cx.shared-root", cx);
        localStorage.setItem("Edited.cx.shared-root", "1");
    }
}

async function decideMirror(): Promise<void> {
    const URLS = {
        "alicorn-bmclapi-nonfree":
            "https://bmclapi2.bangbang93.com/mc/game/version_manifest.json",
        none: "https://piston-meta.mojang.com/mc/game/version_manifest.json",
        alicorn: "https://al-versions-manifest.vercel.app/api/mojang"
    };
    let sl = "none";
    let rtt = 0;
    for (const [n, u] of Object.entries(URLS)) {
        try {
            const d0 = new Date();
            const [ac, sti] = getTimeoutController(3000);
            const r = await fetch(u, {signal: ac.signal});
            sti();
            const d1 = new Date();
            if (r.ok) {
                const dt = d1.getTime() - d0.getTime();
                if (dt < rtt) {
                    sl = n;
                    rtt = dt;
                }
            }
        } catch {}
    }
    set("download.mirror", sl);
}
