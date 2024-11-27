import type { Rule } from "@/main/profile/version-profile";
import { getOSName } from "@/main/sys/os";
import os from "node:os";

/**
 * Filter the rules based on OS information and given feature set.
 */
export function filterRules(r: Rule[] | undefined, features: Set<string>): boolean {
    if (!r || r.length === 0) return true;
    const match = r.findLast(it => {
        const criteria = [];
        if (it.os) {
            if (it.os.name) criteria.push(it.os.name === getOSName());
            if (it.os.version) criteria.push(new RegExp(it.os.version).test(os.version()));
            if (it.os.arch) criteria.push(it.os.arch === os.arch());
        }

        if (it.features) {
            for (const [f, v] of Object.entries(it.features)) {
                criteria.push(features.has(f) === v);
            }
        }

        return criteria.every(Boolean);
    });

    if (match) return match.action === "allow";

    return false;
}