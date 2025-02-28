import { containers } from "@/main/container/manage";
import { games } from "@/main/game/manage";
import { fabricInstaller } from "@/main/install/fabric";
import { forgeInstaller } from "@/main/install/forge";
import { forgeCompat } from "@/main/install/forge-compat";
import { neoforgedInstaller } from "@/main/install/neoforged";
import { quiltInstaller } from "@/main/install/quilt";
import { smelt, type SmeltInstallInit } from "@/main/install/smelt";
import { smeltLegacy } from "@/main/install/smelt-legacy";
import { vanillaInstaller } from "@/main/install/vanilla";
import { ipcMain } from "@/main/ipc/typed";
import { jrt } from "@/main/jrt/install";
import { profileLoader } from "@/main/profile/loader";
import { reg } from "@/main/registry/registry";
import { exceptions } from "@/main/util/exception";
import type { Progress, ProgressController } from "@/main/util/progress";
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

type ForgeInstallActionType = "smelt" | "smelt-legacy" | "merge" | "none";

const installControllers = new Map<string, AbortController>();

ipcMain.on("cancelInstall", (_, gameId) => {
    const ac = installControllers.get(gameId);
    installControllers.delete(gameId);
    ac?.abort(exceptions.create("cancelled", {}));
});

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

    const abortController = new AbortController();
    installControllers.set(gameId, abortController);

    try {
        const installType = game.installProps.type;
        const { gameVersion } = game.installProps;

        const control: ProgressController = {
            signal: abortController.signal,
            onProgress
        };

        const vanillaProfile = await vanillaInstaller.installProfile(gameVersion, c, control);
        let p = vanillaProfile;

        let forgeInstallerPath: string | null = null;
        let forgeModLoaderPath: string | null = null;
        let forgeInstallerInit: SmeltInstallInit | null = null;
        let forgeInstallAction: ForgeInstallActionType = "none";

        // Preprocess mod loaders, retrieve profile
        if (installType === "fabric") {
            const fid = await fabricInstaller.retrieveProfile(
                gameVersion,
                game.installProps.loaderVersion,
                c,
                control
            );
            p = await profileLoader.fromContainer(fid, c);
        }

        if (installType === "quilt") {
            const qid = await quiltInstaller.retrieveProfile(
                gameVersion,
                game.installProps.loaderVersion,
                c,
                control
            );
            p = await profileLoader.fromContainer(qid, c);
        }

        if (installType === "neoforged") {
            let loaderVersion = game.installProps.loaderVersion;

            if (!loaderVersion) {
                loaderVersion = await neoforgedInstaller.pickLoaderVersion(gameVersion, control);
            }

            forgeInstallerPath = await neoforgedInstaller.downloadInstaller(loaderVersion, control);
            forgeInstallAction = "smelt";

            forgeInstallerInit = await smelt.readInstallProfile(forgeInstallerPath);
            const fid = await smelt.deployVersionProfile(forgeInstallerInit, c);
            p = await profileLoader.fromContainer(fid, c);
        }

        if (installType === "forge") {
            let loaderVersion = game.installProps.loaderVersion;

            if (!loaderVersion) {
                loaderVersion = await forgeInstaller.pickLoaderVersion(gameVersion, control);
            }

            const installerType = forgeInstaller.getInstallType(gameVersion);
            forgeInstallerPath = await forgeInstaller.downloadInstaller(loaderVersion, installerType, control);

            const modLoaderUrl = await forgeCompat.getModLoaderUrl(gameVersion);
            forgeModLoaderPath = modLoaderUrl && await forgeCompat.downloadModLoader(modLoaderUrl);

            if (installerType === "installer") {
                const legacyProfileId = await smeltLegacy.dumpContent(forgeInstallerPath, c);
                if (legacyProfileId) {
                    forgeInstallAction = "smelt-legacy";
                    p = await profileLoader.fromContainer(legacyProfileId, c);
                } else {
                    forgeInstallAction = "smelt";
                    forgeInstallerInit = await smelt.readInstallProfile(forgeInstallerPath);
                    const fid = await smelt.deployVersionProfile(forgeInstallerInit, c);
                    p = await profileLoader.fromContainer(fid, c);
                }
            } else {
                forgeInstallAction = "merge";
                if (modLoaderUrl) {
                    // There exists a bug with ModLoader which makes it incompatible with the directory structure
                    // This cannot be fixed even with VENV
                    // We're using a patch named DAMT: https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/minecraft-mods/mods-discussion/1291855-a-custom-tweaker-for-using-older-modloaders-in-the
                    await forgeCompat.patchProfile(c, gameVersion);
                    p = await profileLoader.fromContainer(gameVersion, c);
                } else {
                    p = vanillaProfile;
                }

            }
        }

        // Ensure libraries
        await jrt.installRuntime(p.javaVersion?.component ?? "jre-legacy", control);

        await vanillaInstaller.installLibraries(p, c, new Set(), control);

        // Finalize Forge
        if (installType === "neoforged" || installType === "forge") {
            if (forgeInstallAction === "smelt") {
                await smelt.runPostInstall(forgeInstallerInit!, forgeInstallerPath!, p, c, control);
            } else if (forgeInstallAction === "merge") {
                await smeltLegacy.patchLegacyLibraries(
                    jrt.executable(p.javaVersion?.component ?? "jre-legacy"),
                    forgeInstallerPath!,
                    c
                );

                const clientPath = c.client(p.version || p.id);

                if (forgeModLoaderPath) {
                    await smeltLegacy.mergeClient(forgeModLoaderPath, clientPath);
                }

                await smeltLegacy.mergeClient(forgeInstallerPath!, clientPath);
            }

            game.launchHint.venv = await forgeCompat.shouldUseVenv(gameVersion);
            await fs.remove(forgeInstallerPath!);
        }

        // Game-level post install
        await vanillaInstaller.installAssets(p, c, game.assetsLevel, control);
        await vanillaInstaller.emitOptions(c);

        game.launchHint.profileId = p.id;
        game.installed = true;
        games.add(game);

        console.debug(`Completed installation of ${gameId}`);
        send({ type: "finish" });

        port.close();
    } catch (e) {
        send({ type: "error", err: e });
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
