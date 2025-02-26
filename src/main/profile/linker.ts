import { patchProfile } from "@/main/profile/profile-adaptor";
import type { VersionProfile } from "@/main/profile/version-profile";
import { mergician } from "mergician";

/**
 * Links the given profiles.
 *
 * This method does a formal deep merge on the given objects with only the key 'inheritsFrom' parsed.
 *
 * @param id The ID of the profile to be linked.
 * @param provider A function which this method calls to retrieve extra profiles for linking.
 */
export async function linkProfile(id: string, provider: (id: string) => unknown | Promise<unknown>): Promise<VersionProfile> {
    let circular = new Set();
    let obj = { inheritsFrom: id, version: id };

    while (obj.inheritsFrom) {
        const nextID = obj.inheritsFrom;
        if (circular.has(nextID)) throw `Circular dependency detected: ${nextID}`;
        circular.add(nextID);

        const s = await provider(nextID);

        if (typeof s === "object" && s !== null && "inheritsFrom" in s && typeof s.inheritsFrom === "string") {
            obj.inheritsFrom = s.inheritsFrom; // Pass the inheritance relationship on
        } else {
            obj.inheritsFrom = ""; // Terminates the inheritance
        }

        obj = mergician({
            prependArrays: true
        })(s, obj);

        obj.version = nextID;
    }

    await patchProfile(obj);

    if ("libraries" in obj && Array.isArray(obj.libraries)) {
        obj.libraries = combineLibraries(obj.libraries);
    }

    if (obj.inheritsFrom || !("id" in obj)) {
        throw `Link unsatisfied: ${id} has no complete inheritance`;
    }

    return obj as VersionProfile;
}

function combineLibraries(libs: unknown[]): unknown[] {
    const out: { name: string } [] = [];

    outer: for (const lib of libs.toReversed()) {
        if (typeof lib === "object" && lib && "name" in lib && typeof lib.name === "string") {
            for (const [index, existingLib] of out.entries()) {
                if (existingLib.name === lib.name && existingLib !== lib) {
                    // Merge lib -> existingLib
                    out[index] = mergician(existingLib, lib) as { name: string };
                    continue outer;
                }
            }
            out.unshift(lib as { name: string });
        }
    }

    return out;
}
