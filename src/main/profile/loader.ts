/**
 * Utilities for loading profiles.
 */
import { Container } from "@/main/container/spec";
import { VersionProfile } from "@/main/profile/version-profile";
import { linkProfile } from "@/main/profile/linker";
import fs from "fs-extra";

async function fromContainer(id: string, container: Container): Promise<VersionProfile> {
    return await linkProfile(id, (i) => fs.readJSON(container.profile(i)));
}


async function assetIndexShouldMap(assetIndexId: string, container: Container): Promise<boolean> {
    const a = await fs.readJSON(container.assetIndex(assetIndexId));
    return "map_to_resources" in a && !!a["map_to_resources"];
}


export const profileLoader = {
    fromContainer, assetIndexShouldMap
};