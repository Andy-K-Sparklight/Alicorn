import { containers } from "@/main/container/manage";
import { games } from "@/main/game/manage";
import { fabricInstaller } from "@/main/install/fabric";
import { forgeInstaller } from "@/main/install/forge";
import { neoforgedInstaller } from "@/main/install/neoforged";
import { quiltInstaller } from "@/main/install/quilt";
import { smelt, type SmeltInstallInit } from "@/main/install/smelt";
import { smeltLegacy } from "@/main/install/smelt-legacy";
import { vanillaInstaller } from "@/main/install/vanilla";
import { ipcMain } from "@/main/ipc/typed";
import { jrt } from "@/main/jrt/install";
import { profileLoader } from "@/main/profile/loader";
import type { VersionProfile } from "@/main/profile/version-profile";
import { reg } from "@/main/registry/registry";
import type { Progress } from "@/main/util/progress";
import fs from "fs-extra";

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

ipcMain.on("installGame", async (e, gameId) => {
    const [port] = e.ports;
    console.debug(`Starting installation of ${gameId}`);

    const game = structuredClone(reg.games.get(gameId));
    const c = containers.get(game.launchHint.containerId);

    function send(e: VanillaInstallEvent) {
        port.postMessage(e);
    }

    function onProgress(p: Progress) {
        send({ type: "progress", progress: p });
    }

    // TODO add signal control to stop the action

    try {
        const installType = game.installProps.type;
        const { gameVersion } = game.installProps;

        let forgeInstallerPath: string | null = null;
        let forgeInstallerInit: SmeltInstallInit | null = null;
        let forgeInstallerType: "installer" | "universal" | "client" = "installer";
        let forgeInstallerLegacy = "";

        if (installType === "neoforged") {
            let loaderVersion = game.installProps.loaderVersion;

            if (!loaderVersion) {
                loaderVersion = await neoforgedInstaller.pickLoaderVersion(gameVersion, { onProgress });
            }

            forgeInstallerPath = await neoforgedInstaller.downloadInstaller(loaderVersion, { onProgress });
        }

        if (installType === "forge") {
            let loaderVersion = game.installProps.loaderVersion;

            if (!loaderVersion) {
                loaderVersion = await forgeInstaller.pickLoaderVersion(gameVersion, { onProgress });
            }

            forgeInstallerType = forgeInstaller.getInstallType(gameVersion);
            forgeInstallerPath = await forgeInstaller.downloadInstaller(loaderVersion, forgeInstallerType, { onProgress });

            if (forgeInstallerType === "installer") {
                forgeInstallerLegacy = await smeltLegacy.dumpContent(forgeInstallerPath, c);
            }
        }

        if (forgeInstallerPath && !forgeInstallerLegacy && forgeInstallerType === "installer") {
            forgeInstallerInit = await smelt.readInstallProfile(forgeInstallerPath);
        }

        let p: VersionProfile;
        const vanillaProfile = await vanillaInstaller.installProfile(gameVersion, c, { onProgress });

        switch (installType) {
            case "vanilla":
                p = vanillaProfile;
                break;

            case "fabric": {
                const fid = await fabricInstaller.retrieveProfile(
                    gameVersion,
                    game.installProps.loaderVersion,
                    c,
                    { onProgress }
                );
                p = await profileLoader.fromContainer(fid, c);
                break;
            }

            case "quilt": {
                const qid = await quiltInstaller.retrieveProfile(
                    gameVersion,
                    game.installProps.loaderVersion,
                    c,
                    { onProgress }
                );
                p = await profileLoader.fromContainer(qid, c);
                break;
            }

            case "neoforged":
            case "forge":
                if (forgeInstallerType !== "installer") {
                    p = vanillaProfile;
                } else if (forgeInstallerLegacy) {
                    p = await profileLoader.fromContainer(forgeInstallerLegacy, c);
                } else {
                    const fid = await smelt.deployVersionProfile(forgeInstallerInit!, c);
                    p = await profileLoader.fromContainer(fid, c);
                }

                break;
        }

        game.launchHint.profileId = p.id;

        await jrt.installRuntime(p.javaVersion?.component ?? "jre-legacy", { onProgress });

        await vanillaInstaller.installLibraries(p, c, new Set(), { onProgress });

        if (installType === "neoforged" || installType === "forge") {
            if (forgeInstallerInit && forgeInstallerType === "installer") {
                await smelt.runPostInstall(forgeInstallerInit!, forgeInstallerPath!, p, c, { onProgress });
            } else {
                await smeltLegacy.mergeClient(forgeInstallerPath!, c.client(p.id));
            }

            await fs.remove(forgeInstallerPath!);
        }

        await vanillaInstaller.installAssets(p, c, game.assetsLevel, { onProgress });

        await vanillaInstaller.emitOptions(c);

        game.installed = true;
        games.add(game);

        console.debug(`Completed installation of ${gameId}`);
        send({ type: "finish" });

        port.close();
    } catch (e) {
        send({ type: "error", err: e });

        port.close();
    }
});

ipcMain.handle("queryAvailableModLoaders", async (_, gameVersion) => {
    const supported: string[] = [];

    const [
        fabricVersions,
        quiltVersions,
        neoforgedVersions,
        forgeVersions
    ] = await Promise.all([
        fabricInstaller.getAvailableGameVersions(),
        quiltInstaller.getAvailableGameVersions(),
        neoforgedInstaller.queryLoaderVersions(gameVersion),
        forgeInstaller.queryLoaderVersions(gameVersion)
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

    // TODO add other mod loaders

    return supported;
});
