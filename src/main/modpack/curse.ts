import { containers } from "@/main/container/manage";
import type { Container } from "@/main/container/spec";
import { games } from "@/main/game/manage";
import type { GameCoreType, GameProfile } from "@/main/game/spec";
import type { InstallerProps } from "@/main/install/installers";
import type { ModpackMetaSlim } from "@/main/modpack/common";
import { curse } from "@/main/mpm/curse";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import StreamZip from "node-stream-zip";
import path from "node:path";

interface CurseModpackManifest {
    minecraft: {
        version: string;
        modLoaders: CurseModLoaderSpec[]
    };
    manifestVersion: 1;
    name: string;
    author: string;
    version: string;
    files: CurseModSpec[];
    overrides: string;
}

interface CurseModSpec {
    projectID: number;
    fileID: number;
    required: boolean;
}

interface CurseModLoaderSpec {
    id: string;
    primary: boolean;
}

function inferGameType(mf: CurseModpackManifest): GameCoreType {
    const primaryLoader = mf.minecraft.modLoaders.find(m => m.primary)?.id;
    if (primaryLoader) {
        const [tp] = primaryLoader.split(/-(.*)/);
        switch (tp) {
            case "fabric":
                return "fabric";
            case "neoforge":
            case "neoforged":
                return "neoforged";
            case "quilt":
                return "quilt";
            case "liteloader":
                return "liteloader";
        }
    } else {
        // TODO possibility of snapshots?
        return "vanilla-release";
    }

    return "unknown";
}

function createDelegateInstallerProps(mf: CurseModpackManifest): InstallerProps {
    const gameVersion = mf.minecraft.version;
    const primaryLoader = mf.minecraft.modLoaders.find(m => m.primary);

    if (primaryLoader) {
        const [tp, ver] = primaryLoader.id.split(/-(.*)/);
        switch (tp) {
            case "fabric":
                return {
                    type: "fabric",
                    gameVersion, loaderVersion: ver
                };
            case "neoforge":
            case "neoforged":
                return {
                    type: "neoforged",
                    gameVersion, loaderVersion: ver
                };
            case "quilt":
                return {
                    type: "quilt",
                    gameVersion, loaderVersion: ver
                };
            case "liteloader":
                return {
                    type: "liteloader",
                    gameVersion
                };
            default:
                throw `Unsupported mod loader: ${tp}`;
        }
    } else {
        // Install vanilla
        return {
            type: "vanilla",
            gameVersion
        };
    }
}

async function createGame(mf: CurseModpackManifest, accountId: string): Promise<GameProfile> {
    const c = await containers.genContainerProps("MP");
    containers.add(c);
    const g: GameProfile = {
        id: games.genId(),
        name: `${mf.name} ${mf.version}`,
        assetsLevel: "full",
        installed: false,
        launchHint: {
            accountId: accountId,
            containerId: c.id,
            pref: {},
            profileId: ""
        },
        installProps: {
            type: "modpack",
            vendor: "curse",
            source: "", // Need to be assigned later
            delegate: createDelegateInstallerProps(mf)
        },
        time: Date.now(),
        versions: {
            game: mf.minecraft.version
        },
        locked: true,
        user: {},
        type: inferGameType(mf)
    };
    games.add(g);
    console.debug(`Generated game name: ${g.name}`);
    console.debug(`Inferred game type: ${g.type}`);
    return g;
}

async function readMetadata(zip: StreamZip.StreamZipAsync): Promise<ModpackMetaSlim> {
    const dat = await zip.entryData("manifest.json");
    const mf = await JSON.parse(dat.toString());

    if (mf.manifestVersion !== 1) {
        throw "Unsupported Curseforge modpack manifest";
    }
    const emf = mf as CurseModpackManifest;

    return {
        name: emf.name,
        author: emf.author,
        gameVersion: emf.minecraft.version,
        version: emf.version
    };
}

async function deploy(fp: string, accountId: string) {
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        console.debug(`Reading Curseforge modpack from ${fp}`);

        zip = new StreamZip.async({ file: fp });
        const manifest = JSON.parse((await zip.entryData("manifest.json")).toString());

        if (manifest.manifestVersion !== 1) {
            throw "Unsupported Curseforge modpack manifest";
        }

        const game = await createGame(manifest, accountId);
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
    console.debug(`Finalizing Curseforge modpack installation from ${fp}`);
    let zip: StreamZip.StreamZipAsync | null = null;

    try {
        zip = new StreamZip.async({ file: fp });
        const manifest = JSON.parse((await zip.entryData("manifest.json")).toString());

        const files: CurseModSpec[] = manifest.files;
        if (Array.isArray(files)) {
            const fileDetails = await curse.getFiles(files.map(f => f.fileID));
            // TODO limit promise concurrency
            const tsk: DlxDownloadRequest[] = fileDetails.map(f => ({
                url: f.downloadUrl,
                path: container.addon("mods", f.fileName), // TODO other addon types
                fastLink: container.props.flags.link
            }));

            await dlx.getAll(tsk, {
                signal,
                onProgress: progress.makeNamed(onProgress, "modpack.download-mods")
            });
        }

        const overridesFolder = manifest.overrides;

        if (overridesFolder) {
            const entries = await zip.entries();
            const ps = Object.values(entries)
                .filter(ent => ent.name.startsWith(overridesFolder + "/") && ent.isFile)
                .map(async ent => {
                    const fp = path.join(container.gameDir(), ent.name.slice(overridesFolder.length + 1));

                    console.debug(`Extracting override file: ${ent.name} -> ${fp}`);

                    await fs.ensureDir(path.dirname(fp));
                    await fs.remove(fp);
                    await zip!.extract(ent, fp);
                });

            const countedPromises = progress.countPromises(ps, progress.makeNamed(onProgress, "modpack.unpack-files"));
            await Promise.all(countedPromises);
        }
    } finally {
        zip?.close();
    }
}

export const curseModpack = { deploy, finalizeInstall, readMetadata };
