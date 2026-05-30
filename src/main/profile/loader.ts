/**
 * Utilities for loading profiles.
 */

import fs from "fs-extra";
import type { Container } from "@/main/container/spec";
import { AbstractException } from "@/main/except/exception";
import { linkProfile } from "@/main/profile/linker";
import type { VersionProfile } from "@/main/profile/version-profile";

class ProfileLinkFailedException extends AbstractException<"profile-link-failed"> {
    #id: string;

    constructor(id: string) {
        super("profile-link-failed", { id });
        this.#id = id;
    }

    toString(): string {
        return `Failed to link profile ${this.#id}`;
    }
}

async function fromContainer(id: string, container: Container): Promise<VersionProfile> {
    try {
        return await linkProfile(id, i => fs.readJSON(container.profile(i)));
    } catch (_e) {
        throw new ProfileLinkFailedException(id);
    }
}

async function assetIndexShouldMap(assetIndexId: string, container: Container): Promise<boolean> {
    const a = await fs.readJSON(container.assetIndex(assetIndexId));
    return "map_to_resources" in a && !!a.map_to_resources;
}

async function isLegacyAssets(assetIndexId: string): Promise<boolean> {
    // This module fails to unwrap as its export value is an array
    // We need to unwrap manually
    const legacyAssets = (await import("@/refs/legacy-assets.json")).default as string[];
    return legacyAssets.includes(assetIndexId);
}

export const profileLoader = {
    fromContainer,
    assetIndexShouldMap,
    isLegacyAssets,
};
