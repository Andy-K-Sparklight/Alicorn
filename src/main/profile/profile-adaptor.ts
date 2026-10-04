/**
 * Converts and patches non-standard profile models.
 */

import { lwjglARMPatch } from "@/main/profile/lwjgl-arm-patch";
import { unwrapESM } from "@/main/util/module";

/**
 * Patches `javaVersion` property in-place.
 */
async function patchJRTVersion(src: Record<string, unknown>) {
    if ("javaVersion" in src) return;

    if ("id" in src && typeof src.id === "string") {
        const { versions, runtimes } = await unwrapESM(import("@/refs/jrt-versions.json"));
        if (Object.hasOwn(versions, src.id)) {
            const index = (versions as Record<string, number>)[src.id];
            src.javaVersion = { component: runtimes[index] };
            return;
        }
    }

    src.javaVersion = { component: "jre-legacy" };
}

/**
 * Transforms legacy profile into standard profile if applicable.
 */
async function transformLegacy(src: Record<string, unknown>): Promise<void> {
    if ("minecraftArguments" in src) {
        const gameArgs = (
            typeof src.minecraftArguments === "string" ? src.minecraftArguments : ""
        ).split(" ");
        const { vmArgs } = await unwrapESM(import("@/refs/default-vm-args.json"));
        src.arguments = {
            game: gameArgs,
            jvm: vmArgs,
        };
    }
}

/**
 * Patches the given profile in-place.
 * Preserves explicit `javaVersion` values, inferring missing values by ID with a `jre-legacy` fallback.
 */
export async function patchProfile(src: Record<string, unknown>): Promise<void> {
    await patchJRTVersion(src);
    await transformLegacy(src);

    if ("libraries" in src && Array.isArray(src.libraries)) {
        await lwjglARMPatch.patchLibraries(src.libraries);
    }
}
