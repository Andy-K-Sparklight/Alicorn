/**
 * Converts and patches non-standard profile models.
 */

import { lwjglARMPatch } from "@/main/profile/lwjgl-arm-patch";
import { unwrapESM } from "@/main/util/module";

/**
 * Patches compliance level in-place.
 */
async function patchComplianceLevel(src: Record<string, unknown>) {
    if ("complianceLevel" in src) return;

    // Profiles installed earlier are more likely to be missing this key
    // We infer it as 0 as the last choice.
    let level = 0;

    if ("minecraftArguments" in src) {
        level = 0;
    } else if ("arguments" in src) {
        level = 1;
    } else {
        let version = "";
        if ("version" in src && typeof src["version"] === "string") {
            version = src.version;
        } else if ("id" in src && typeof src["id"] === "string") {
            version = src.id;
        }
        if (version) {
            const { complianceLevels } = await unwrapESM(import("@/refs/compliance-levels.json"));
            if (version in complianceLevels) {
                level = (complianceLevels as Record<string, number>)[version];
            }
        }
    }

    src.complianceLevel = level;
}

/**
 * Patches `javaVersion` property in-place.
 */
async function patchJRTVersion(src: Record<string, unknown>) {
    if ("javaVersion" in src) return;

    if ("id" in src && typeof src["id"] === "string") {
        const jrtVersions = await unwrapESM(import("@/refs/jrt-versions.json"));
        for (const [k, v] of Object.entries(jrtVersions)) {
            if (Array.isArray(v) && v.includes(src.id)) {
                src["javaVersion"] = { component: k };
                return;
            }
        }
    }
}

/**
 * Transforms legacy profile into standard profile if applicable.
 *
 * This method requires on 'complianceLevel' to be defined. Use 'patchComplianceLevel' to infer one.
 */
async function transformLegacy(src: Record<string, unknown>): Promise<void> {
    if (!("complianceLevel" in src)) return; // Unable to transform

    if (src.complianceLevel === 0 && "minecraftArguments" in src) {
        const gameArgs = (typeof src["minecraftArguments"] === "string" ? src["minecraftArguments"] : "").split(" ");
        const { vmArgs } = await unwrapESM(import("@/refs/default-vm-args.json"));
        src.arguments = {
            game: gameArgs,
            jvm: vmArgs
        };
    }
}

/**
 * Patches the given profile in-place.
 */
export async function patchProfile(src: Record<string, unknown>): Promise<void> {
    await patchComplianceLevel(src);
    await patchJRTVersion(src);
    await transformLegacy(src);

    if ("libraries" in src && Array.isArray(src["libraries"])) {
        await lwjglARMPatch.patchLibraries(src["libraries"]);
    }
}
