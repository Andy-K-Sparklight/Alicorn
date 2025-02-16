import { containers } from "@/main/container/manage";
import { games } from "@/main/game/manage";
import { fabricInstaller } from "@/main/install/fabric";
import { vanillaInstaller } from "@/main/install/vanilla";
import { ipcMain } from "@/main/ipc/typed";
import { jrt } from "@/main/jrt/install";
import { profileLoader } from "@/main/profile/loader";
import type { VersionProfile } from "@/main/profile/version-profile";
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

ipcMain.on("installGame", async (e, gameId) => {
    const [port] = e.ports;
    console.debug(`Starting installation of ${gameId}`);

    // TODO check game installer type

    const game = structuredClone(reg.games.get(gameId));
    const c = containers.get(game.launchHint.containerId);

    function send(e: VanillaInstallEvent) {
        port.postMessage(e);
    }

    function onProgress(p: Progress) {
        send({ type: "progress", progress: p });
    }

    // TODO add signal control to stop the action

    const installType = game.installProps.type;
    const { gameVersion } = game.installProps;

    let p: VersionProfile;
    const vanillaProfile = await vanillaInstaller.installProfile(gameVersion, c, { onProgress });

    switch (installType) {
        case "vanilla":
            p = vanillaProfile;
            break;
        case "fabric": {
            const fid = await fabricInstaller.retrieveProfile(gameVersion, game.installProps.loaderVersion, c);
            p = await profileLoader.fromContainer(fid, c);
            break;
        }
    }

    game.launchHint.profileId = p.id;

    // TODO patch `javaVersion` for legacy profiles without such key
    await jrt.installRuntime(p.javaVersion?.component ?? "jre-legacy", { onProgress });

    await vanillaInstaller.installLibraries(p, c, new Set(), { onProgress });

    await vanillaInstaller.installAssets(p, c, game.assetsLevel, { onProgress });

    await vanillaInstaller.emitOptions(c);

    game.installed = true;
    games.add(game);

    console.debug(`Completed installation of ${gameId}`);
    // TODO add error handler
    send({ type: "finish" });

    port.close();
});
