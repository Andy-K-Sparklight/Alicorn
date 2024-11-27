import type { VersionProfile } from "@/main/profile/version-profile";
import { mergician } from "mergician";
import { is } from "typia";
import { patchProfile } from "@/main/profile/profile-adaptor";

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

    if (is<VersionProfile>(obj)) return obj;

    throw `Link unsatisfied: ${id} has no complete inheritance`;
}