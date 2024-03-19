// CommonModpackModel, aka MCBBS Modpack Model
// Some features, like force update, are disabled since they allow developers to control users' computers
// Custom args are ignored since they are unsafe - can simply run shell commands!
// Hash will be preserved, but will not be judged - it only bring more troubles
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { ProfileType } from "../../profile/WhatProfile";
import { ModpackModel, SimpleFile } from "./CFModpackModel";
import { deployModLoader, deployProfile } from "./InstallModpack";

// Design like this is not great, but we can use 'as' instead of 'safeGet', easier
export interface CommonModpackModel {
    name: string;
    version: string;
    author: string;
    description: string;
    url: string;
    addons: {
        id: string;
        version: string;
        mcversion?: string;
        "-al-mcversion"?: string; // Alicorn private support for mcversion on fabric
    }[];
    files: (OverrideFile | SimpleFile)[]; // Compatibility
    overrideSourceDir: string; // Binding
}

export interface OverrideFile {
    path: string;
    hash: string;
    force: boolean;
}

export function generateBaseVersion(
    m: CommonModpackModel | ModpackModel
): string {
    // @ts-ignore
    if (!m.baseVersion) {
        // @ts-ignore
        for (const c of m.addons) {
            if (c.id.toLowerCase() === "game") {
                return c.version;
            }
        }
        return "";
    } else {
        // @ts-ignore
        return m.baseVersion;
    }
}

async function xdeploy(
    o: {
        id: string;
        version: string;
        mcversion?: string;
        "-al-mcversion"?: string;
    },
    model: CommonModpackModel,
    container: MinecraftContainer
): Promise<void> {
    switch (o.id.toLowerCase()) {
        case "forge":
            await deployModLoader(ProfileType.FORGE, o.version, container);
            break;
        case "game":
            break; // Base Profile Should have been installed
        case "fabric":
        default: {
            const v = (o.mcversion || o["-al-mcversion"] || "").trim();
            await deployModLoader(
                ProfileType.FABRIC,
                o.version,
                container,
                v.length === 0 ? getAllGames(model) : [v]
            );
        }
    }
}

function getAllGames(model: CommonModpackModel): string[] {
    const ax = new Set<string>();
    model.addons.forEach((a) => {
        if (a.id.trim().toLowerCase() === "game") {
            ax.add(a.version.trim());
        }
    });
    return Array.from(ax);
}

export async function deployAllGameProfiles(
    m: CommonModpackModel,
    container: MinecraftContainer
): Promise<void> {
    await Promise.allSettled(
        m.addons.map(async (v) => {
            if (v.id.toLowerCase() === "game") {
                await deployProfile(v.version, container);
            }
        })
    );
}

export async function deployAllModLoaders(
    m: CommonModpackModel,
    container: MinecraftContainer
): Promise<void> {
    await Promise.allSettled(
        m.addons.map(async (l) => {
            await xdeploy(l, m, container);
        })
    );
}

export function generateDefaultModLoader(
    m: ModpackModel | CommonModpackModel
): ProfileType {
    // @ts-ignore
    if (m.baseVersion) {
        return (m as ModpackModel).modLoaders[0].type || ProfileType.FORGE;
    } else {
        m = m as CommonModpackModel;
        for (const x of m.addons) {
            if (x.id.toLowerCase() === "forge") {
                return ProfileType.FORGE;
            }
            if (x.id.toLowerCase() === "fabric") {
                return ProfileType.FABRIC;
            }
        }
        return ProfileType.FORGE;
    }
}
