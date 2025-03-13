import { containers } from "@/main/container/manage";
import { games } from "@/main/game/manage";
import type { GameCoreType, GameProfile } from "@/main/game/spec";
import { profileLoader } from "@/main/profile/loader";
import { isTruthy } from "@/main/util/misc";
import fs from "fs-extra";
import path from "node:path";

/**
 * Infers the type of the profile without linking it.
 */
function detectProfileType(p: any): GameCoreType {
    if ("libraries" in p && Array.isArray(p.libraries)) {
        const effectiveLibs = p.libraries.filter((lib: any) => "name" in lib && typeof lib.name === "string");

        for (const lib of effectiveLibs) {
            if (lib.name.includes("neoforge")) return "neoforged";
            if (lib.name.includes("quilt")) return "quilt";
            if (lib.name.includes("optifine")) return "optifine";
            if (lib.name.includes("liteloader")) return "liteloader";
            if (lib.name.includes("rift")) return "rift";
        }

        for (const lib of effectiveLibs) {
            if (lib.name.includes("forge")) return "forge";
            if (lib.name.includes("fabric")) return "fabric";
        }
    }

    if ("mainClass" in p && typeof p.mainClass === "string" && !("inheritsFrom" in p)) {
        if (
            p.mainClass === "net.minecraft.client.main.Main" ||
            p.mainClass === "net.minecraft.launchwrapper.Launch" ||
            p.mainClass === "com.mojang.rubydung.RubyDung"
        ) {
            // Possibly vanilla
            if ("type" in p && typeof p.type === "string") {
                switch (p.type) {
                    case "snapshot":
                        return "vanilla-snapshot";
                    case "release":
                        return "vanilla-release";
                    case "old_alpha":
                        return "vanilla-old-alpha";
                    case "old_beta":
                        return "vanilla-old-beta";
                }
            }
        }
    }

    return "unknown";
}

async function detectGameVersion(fp: string): Promise<string> {
    try {
        const root = path.join(fp, "..", "..", "..");
        const c = containers.create({
            id: "importer",
            root,
            flags: {}
        });

        const ep = await profileLoader.fromContainer(fp, c);
        return ep.version || ep.id;
    } catch {
        const p = await fs.readJSON(fp);
        return String(p.inheritsFrom || p.id);
    }
}

async function doImport(name: string, fp: string, accountId: string): Promise<void> {
    const p = await fs.readJSON(fp);
    const type = detectProfileType(p);
    const ver = await detectGameVersion(fp);

    const containerRoot = path.normalize(path.join(fp, "..", "..", ".."));

    const c = await containers.genContainerProps("INC");
    c.root = containerRoot;

    const g: GameProfile = {
        id: games.genId(),
        type,
        assetsLevel: "full",
        name,
        versions: {
            game: ver
        },
        launchHint: {
            profileId: path.basename(fp, ".json"),
            containerId: c.id,
            pref: {},
            accountId
        },
        installProps: {
            type: "imported",
            profileId: String(p.id)
        },
        installed: false,
        locked: true,
        time: Date.now(),
        user: {}
    };

    containers.add(c);
    games.add(g);
}


async function scanImportableProfiles(root: string): Promise<string[]> {
    try {
        const files = await fs.readdir(path.join(root, "versions"), { withFileTypes: true });
        const versions = files.filter(f => f.isDirectory()).map(f => f.name);
        const effectiveVersions = await Promise.all(
            versions.map(async v => {
                const p = path.join(root, "versions", v);
                if (await fs.pathExists(p)) {
                    return v;
                }
                return null;
            })
        );

        return effectiveVersions.filter(isTruthy);
    } catch (e) {
        console.error(`Could not scan profiles in ${root}`);
        console.error(e);
        return [];
    }
}

export const gameMigrator = { doImport, scanImportableProfiles };
