import { containers } from "@/main/container/manage";
import type { Container } from "@/main/container/spec";
import { games } from "@/main/game/manage";
import type { GameCoreType, GameProfile } from "@/main/game/spec";
import type { InstallerProps } from "@/main/install/installers";
import type { ModpackMetaSlim } from "@/main/modpack/common";
import { modpackTools } from "@/main/modpack/tools";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import StreamZip from "node-stream-zip";
import path from "node:path";

interface ModrinthManifest {
    name: string;
    formatVersion: 1;
    versionId: string;
    files: ModrinthFile[];
    dependencies: Record<string, string>;
}

interface ModrinthFile {
    path: string;
    hashes: { sha1: string; };
    env: { client?: "required" | string };
    downloads: string[];
    fileSize: number;
}

function inferGameType(mf: ModrinthManifest): GameCoreType {
    const deps = Object.keys(mf.dependencies);

    if (deps.includes("fabric-loader")) return "fabric";
    if (deps.includes("quilt-loader")) return "quilt";
    if (deps.includes("neoforge")) return "neoforged";
    if (deps.includes("forge")) return "forge";

    return "vanilla-release";
}

function createDelegateInstallerProps(mf: ModrinthManifest): InstallerProps {
    const tp = inferGameType(mf);

    if (tp.startsWith("vanilla")) {
        return {
            type: "vanilla",
            gameVersion: mf.dependencies.minecraft
        };
    } else {
        return {
            type: tp as any,
            gameVersion: mf.dependencies.minecraft,
            loaderVersion: mf.dependencies[tp]
        };
    }
}

async function createGame(mf: ModrinthManifest): Promise<GameProfile> {
    const c = await containers.genContainerProps("MP");
    const g: GameProfile = {
        id: games.genId(),
        name: `${mf.name} ${mf.versionId}`,
        assetsLevel: "full",
        installed: false,
        launchHint: {
            accountId: "",
            containerId: c.id,
            pref: {},
            profileId: ""
        },
        installProps: {
            type: "modpack",
            vendor: "modrinth",
            source: "", // Need to be assigned later
            delegate: createDelegateInstallerProps(mf)
        },
        time: Date.now(),
        user: {},
        versions: {
            game: mf.dependencies.minecraft
        },
        locked: true,
        type: inferGameType(mf)
    };

    containers.add(c);
    games.add(g);
    console.debug(`Generated game name: ${g.name}`);
    console.debug(`Inferred game type: ${g.type}`);
    return g;
}

async function readMetadata(zip: StreamZip.StreamZipAsync): Promise<ModpackMetaSlim> {
    const dat = await zip.entryData("modrinth.index.json");
    const mf = await JSON.parse(dat.toString());

    if (mf.formatVersion !== 1) {
        throw "Unsupported Modrinth modpack manifest";
    }
    const emf = mf as ModrinthManifest;

    return {
        name: emf.name,
        author: "Modrinth",
        gameVersion: emf.dependencies.minecraft,
        version: emf.versionId
    };
}

async function deploy(fp: string) {
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        console.debug(`Reading Modrinth modpack from ${fp}`);

        zip = new StreamZip.async({ file: fp });
        const manifest = JSON.parse((await zip.entryData("modrinth.index.json")).toString());

        if (manifest.formatVersion !== 1) {
            throw "Unsupported Modrinth modpack manifest";
        }

        const game = await createGame(manifest);
        const cc = containers.get(game.launchHint.containerId);
        const mpPath = path.join(cc.gameDir(), "_modpack.zip");
        await fs.ensureDir(path.dirname(mpPath));
        await fs.copyFile(fp, mpPath);

        Object.defineProperty(game.installProps, "source", { value: mpPath });
        games.add(game);
    } finally {
        zip?.close();
    }
}

async function finalizeInstall(container: Container, fp: string, control?: ProgressController) {
    const { onProgress, signal } = control ?? {};

    onProgress?.(progress.indefinite("modpack.resolve-mods"));
    console.debug(`Finalizing Modrinth modpack installation from ${fp}`);
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        zip = new StreamZip.async({ file: fp });
        const manifest = JSON.parse((await zip.entryData("modrinth.index.json")).toString()) as ModrinthManifest;

        const files = manifest.files;
        if (Array.isArray(files)) {
            const tsk: DlxDownloadRequest[] = files
                .filter(f => f.downloads.length > 0)
                .map(f => ({
                    url: f.downloads[0],
                    path: path.join(container.gameDir(), f.path),
                    sha1: f.hashes.sha1,
                    size: f.fileSize,
                    fastLink: container.props.flags.link
                }));

            await dlx.getAll(tsk, {
                signal,
                onProgress: progress.makeNamed(onProgress, "modpack.download-mods")
            });
        }

        await modpackTools.applyOverrides(zip, "overrides/", container.gameDir(), control);
        await modpackTools.applyOverrides(zip, "client-overrides/", container.gameDir(), control);
    } finally {
        zip?.close();
    }
}


export const modrinthModpack = { readMetadata, deploy, finalizeInstall };
