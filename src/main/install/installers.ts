import { containers } from "@/main/container/manage";
import type { Container } from "@/main/container/spec";
import { games } from "@/main/game/manage";
import type { GameProfile } from "@/main/game/spec";
import { fabricInstaller } from "@/main/install/fabric";
import { forgeInstaller } from "@/main/install/forge";
import { forgeCompat } from "@/main/install/forge-compat";
import { neoforgedInstaller } from "@/main/install/neoforged";
import { quiltInstaller } from "@/main/install/quilt";
import { smelt, type SmeltInstallInit } from "@/main/install/smelt";
import { smeltLegacy } from "@/main/install/smelt-legacy";
import { vanillaInstaller } from "@/main/install/vanilla";
import { jrt } from "@/main/jrt/install";
import { profileLoader } from "@/main/profile/loader";
import type { VersionProfile } from "@/main/profile/version-profile";
import type { ProgressController } from "@/main/util/progress";
import fs from "fs-extra";

interface VanillaInstallerProps {
    type: "vanilla";
    gameVersion: string;
}

interface ModLoaderInstallerProps {
    gameVersion: string;
    loaderVersion: string;
}

interface FabricInstallerProps extends ModLoaderInstallerProps {
    type: "fabric";
}

interface QuiltInstallerProps extends ModLoaderInstallerProps {
    type: "quilt";
}

interface NeoForgedInstallerProps extends ModLoaderInstallerProps {
    type: "neoforged";
}

interface ForgeInstallerProps extends ModLoaderInstallerProps {
    type: "forge";
}

export type InstallerProps =
    VanillaInstallerProps
    | FabricInstallerProps
    | QuiltInstallerProps
    | NeoForgedInstallerProps
    | ForgeInstallerProps;

export interface DetailedInstallerContext {
    game: GameProfile;
    container: Container;
    control?: ProgressController;
}

async function installVanilla(props: VanillaInstallerProps, context: DetailedInstallerContext) {
    const { game, container, control } = context;
    const { gameVersion } = props;

    const p = await vanillaInstaller.installProfile(gameVersion, container, control);

    await jrt.installRuntime(p.javaVersion.component, control);
    await vanillaInstaller.installLibraries(p, container, new Set(), control);

    await vanillaInstaller.installAssets(p, container, game.assetsLevel, control);
    await vanillaInstaller.emitOptions(container);

    game.launchHint.profileId = p.id;
}

async function installFabricOrQuilt(props: FabricInstallerProps | QuiltInstallerProps, context: DetailedInstallerContext) {
    const { game, container, control } = context;
    const { gameVersion, loaderVersion } = props;

    await vanillaInstaller.installProfile(gameVersion, container, control);

    const installer = props.type === "fabric" ? fabricInstaller : quiltInstaller;
    const fid = await installer.retrieveProfile(gameVersion, loaderVersion, container, control);
    const p = await profileLoader.fromContainer(fid, container);

    await jrt.installRuntime(p.javaVersion.component, control);
    await vanillaInstaller.installLibraries(p, container, new Set(), control);

    await vanillaInstaller.installAssets(p, container, game.assetsLevel, control);
    await vanillaInstaller.emitOptions(container);

    game.launchHint.profileId = p.id;
}

async function installNeoForged(props: NeoForgedInstallerProps, context: DetailedInstallerContext) {
    const { game, container, control } = context;
    let { gameVersion, loaderVersion } = props;

    await vanillaInstaller.installProfile(gameVersion, container, control);

    if (!loaderVersion) {
        loaderVersion = await neoforgedInstaller.pickLoaderVersion(gameVersion, control);
    }

    const installerPath = await neoforgedInstaller.downloadInstaller(loaderVersion, control);
    const installInit = await smelt.readInstallProfile(installerPath);

    const fid = await smelt.deployVersionProfile(installInit, container);
    const p = await profileLoader.fromContainer(fid, container);

    await jrt.installRuntime(p.javaVersion.component, control);
    await vanillaInstaller.installLibraries(p, container, new Set(), control);

    await smelt.runPostInstall(installInit!, installerPath!, p, container, control);
    await fs.remove(installerPath!);

    await vanillaInstaller.installAssets(p, container, game.assetsLevel, control);
    await vanillaInstaller.emitOptions(container);

    game.launchHint.profileId = p.id;
}

type ForgeInstallActionType = "smelt" | "smelt-legacy" | "merge";

async function installForge(props: ForgeInstallerProps, context: DetailedInstallerContext) {
    const { game, container, control } = context;
    let { gameVersion, loaderVersion } = props;

    const vanillaProfile = await vanillaInstaller.installProfile(gameVersion, container, control);
    let p: VersionProfile;

    let forgeInstallerInit: SmeltInstallInit | null = null;
    let forgeInstallAction: ForgeInstallActionType;

    if (!loaderVersion) {
        loaderVersion = await forgeInstaller.pickLoaderVersion(gameVersion, control);
    }

    const installerType = forgeInstaller.getInstallType(gameVersion);
    const forgeInstallerPath = await forgeInstaller.downloadInstaller(loaderVersion, installerType, control);

    const modLoaderUrl = await forgeCompat.getModLoaderUrl(gameVersion);
    const forgeModLoaderPath = modLoaderUrl && await forgeCompat.downloadModLoader(modLoaderUrl);

    if (installerType === "installer") {
        const legacyProfileId = await smeltLegacy.dumpContent(forgeInstallerPath, container);
        if (legacyProfileId) {
            forgeInstallAction = "smelt-legacy";
            p = await profileLoader.fromContainer(legacyProfileId, container);
        } else {
            forgeInstallAction = "smelt";
            forgeInstallerInit = await smelt.readInstallProfile(forgeInstallerPath);
            const fid = await smelt.deployVersionProfile(forgeInstallerInit, container);
            p = await profileLoader.fromContainer(fid, container);
        }
    } else {
        forgeInstallAction = "merge";
        if (modLoaderUrl) {
            // There exists a bug with ModLoader which makes it incompatible with the directory structure
            // This cannot be fixed even with VENV
            // We're using a patch named DAMT: https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/minecraft-mods/mods-discussion/1291855-a-custom-tweaker-for-using-older-modloaders-in-the
            await forgeCompat.patchProfile(container, gameVersion);
            p = await profileLoader.fromContainer(gameVersion, container);
        } else {
            p = vanillaProfile;
        }

    }

    await jrt.installRuntime(p.javaVersion.component, control);
    await vanillaInstaller.installLibraries(p, container, new Set(), control);

    if (forgeInstallAction === "smelt") {
        await smelt.runPostInstall(forgeInstallerInit!, forgeInstallerPath!, p, container, control);
    } else if (forgeInstallAction === "merge") {
        await smeltLegacy.patchLegacyLibraries(
            jrt.executable(p.javaVersion.component),
            forgeInstallerPath!,
            container
        );

        const clientPath = container.client(p.version || p.id);

        if (forgeModLoaderPath) {
            await smeltLegacy.mergeClient(forgeModLoaderPath, clientPath);
            await fs.remove(forgeModLoaderPath);
        }

        await smeltLegacy.mergeClient(forgeInstallerPath!, clientPath);
    }

    game.launchHint.venv = await forgeCompat.shouldUseVenv(gameVersion);
    await fs.remove(forgeInstallerPath!);

    await vanillaInstaller.installAssets(p, container, game.assetsLevel, control);
    await vanillaInstaller.emitOptions(container);

    game.launchHint.profileId = p.id;
}

const internalInstallers = {
    vanilla: installVanilla,
    fabric: installFabricOrQuilt,
    quilt: installFabricOrQuilt,
    neoforged: installNeoForged,
    forge: installForge
} as const;

async function runInstall(gameId: string, control?: ProgressController) {
    const game = structuredClone(games.get(gameId));
    const props = game.installProps;
    const container = containers.get(game.launchHint.containerId);

    const context: DetailedInstallerContext = { game, container, control };

    await internalInstallers[props.type](props as any, context);

    game.installed = true;
    games.add(game);
}

export const installers = { runInstall };
