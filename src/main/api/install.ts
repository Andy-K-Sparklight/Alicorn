import { containers } from "@/main/container/manage";
import { vanillaInstaller } from "@/main/install/vanilla";
import { ipcMain } from "@/main/ipc/typed";
import { jrt } from "@/main/jrt/install";
import { reg } from "@/main/registry/registry";
import type { Progress } from "@/main/util/progress";

export type VanillaInstallEvent =
    {
        type: "finish"
    } |
    {
        type: "progress",
        progress: Progress;
    }

ipcMain.on("installVanilla", async (e, gameId) => {
    const [port] = e.ports;
    console.debug(`Starting installation of ${gameId}`);

    const game = reg.games.get(gameId);
    const c = containers.get(game.launchHint.containerId);

    function send(e: VanillaInstallEvent) {
        port.postMessage(e);
    }

    function onProgress(p: Progress) {
        send({ type: "progress", progress: p });
    }

    // TODO add signal control to stop the action
    const p = await vanillaInstaller.installProfile(game.launchHint.profileId, c, { onProgress });

    await jrt.installRuntime(p.javaVersion?.component ?? "jre-legacy", { onProgress });
    await vanillaInstaller.installLibraries(p, c, new Set(), { onProgress });

    // TODO add selection for assets installation
    await vanillaInstaller.installAssets(p, c, "full", { onProgress });

    game.installed = true;

    console.debug(`Completed installation of ${gameId}`);
    // TODO add error handler
    send({ type: "finish" });

    port.close();
});
