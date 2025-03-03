import { fabricInstaller } from "@/main/install/fabric";
import { forgeInstaller } from "@/main/install/forge";
import { installers } from "@/main/install/installers";
import { liteloaderInstaller } from "@/main/install/liteloader";
import { neoforgedInstaller } from "@/main/install/neoforged";
import { quiltInstaller } from "@/main/install/quilt";
import { riftInstaller } from "@/main/install/rift";
import { unfine } from "@/main/install/unfine";
import { ipcMain } from "@/main/ipc/typed";
import { exceptions } from "@/main/util/exception";
import type { Progress, ProgressController } from "@/main/util/progress";

export type VanillaInstallEvent =
    {
        type: "finish"
    } |
    {
        type: "error",
        err: unknown
    } |
    {
        type: "progress",
        progress: Progress;
    }

const installControllers = new Map<string, AbortController>();

ipcMain.on("cancelInstall", (_, gameId) => {
    const ac = installControllers.get(gameId);
    installControllers.delete(gameId);
    ac?.abort(exceptions.create("cancelled", {}));
});

ipcMain.on("installGame", async (e, gameId) => {
    const [port] = e.ports;
    console.debug(`Starting installation of ${gameId}`);

    function send(e: VanillaInstallEvent) {
        port.postMessage(e);
    }

    function onProgress(p: Progress) {
        send({ type: "progress", progress: p });
    }

    const abortController = new AbortController();
    installControllers.set(gameId, abortController);

    const control: ProgressController = {
        signal: abortController.signal,
        onProgress
    };

    try {
        await installers.runInstall(gameId, control);

        console.debug(`Completed installation of ${gameId}`);
        send({ type: "finish" });

        port.close();
    } catch (err) {
        send({ type: "error", err });
    } finally {
        port.close();
        installControllers.delete(gameId);
    }
});

ipcMain.handle("queryAvailableModLoaders", async (_, gameVersion) => {
    const supported: string[] = [];

    const [
        fabricVersions,
        quiltVersions,
        neoforgedVersions,
        forgeVersions,
        riftAvailable,
        liteloaderVersions,
        hasOptiFine
    ] = await Promise.all([
        fabricInstaller.getAvailableGameVersions(),
        quiltInstaller.getAvailableGameVersions(),
        neoforgedInstaller.queryLoaderVersions(gameVersion),
        forgeInstaller.queryLoaderVersions(gameVersion),
        riftInstaller.isAvailable(gameVersion),
        liteloaderInstaller.getAvailableVersions(),
        unfine.hasVersion(gameVersion)
    ]);

    if (fabricVersions.includes(gameVersion)) {
        supported.push("fabric");
    }

    if (quiltVersions.includes(gameVersion)) {
        supported.push("quilt");
    }

    if (neoforgedVersions.length > 0) {
        supported.push("neoforged");
    }

    if (forgeVersions.length > 0) {
        supported.push("forge");
    }

    if (riftAvailable) {
        supported.push("rift");
    }

    if (liteloaderVersions.includes(gameVersion)) {
        supported.push("liteloader");
    }

    if (hasOptiFine) {
        supported.push("optifine");
    }

    return supported;
});
