/**
 * Utilities for loading profiles.
 */
import { Container } from "@/main/container/spec";
import { linkProfile } from "@/main/profile/linker";
import { VersionProfile } from "@/main/profile/version-profile";
import { exceptions } from "@/main/util/exception";
import fs from "fs-extra";

async function fromContainer(id: string, container: Container): Promise<VersionProfile> {
    try {
        return await linkProfile(id, (i) => fs.readJSON(container.profile(i)));
    } catch (e) {
        throw exceptions.create("profile-link", { id, error: String(e) });
    }
}


async function assetIndexShouldMap(assetIndexId: string, container: Container): Promise<boolean> {
    const a = await fs.readJSON(container.assetIndex(assetIndexId));
    return "map_to_resources" in a && !!a["map_to_resources"];
}


export const profileLoader = {
    fromContainer, assetIndexShouldMap
};
