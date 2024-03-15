import { isNull } from "../commons/Null";

const FABRIC_NAME = /fabric/i;
const FORGE_NAME = /forge/i;
const QUILT_NAME = /quilt/i;
const MOJANG_NAME_RELEASE = /^[0-9]+?\.[0-9]+?(\.)?[0-9]*$/i;
const MOJANG_NAME_SNAPSHOT = /^[0-9]+?w[0-9]+?[a-z]+$/i;
const LEGACY_VERSIONS = /^1\.([0-9]|1[0-2])([-.a-z].*?)?$/i;
const MOJANG_OLD_AB = /^[ab][0-9]+?\.[0-9]+?.*$/i;
const MOJANG_OLD_CX = /^c[0-9_.]+?[a-z]*?$/i;
const MOJANG_OLD_RD = /^rd-[0-9]+?$/i;
const MOJANG_PRE_RC = /^[0-9]+?\.[0-9]+?(\.)?[0-9]*-(pre|rc)[0-9]*$/i;
const MOJANG_EXPERIMENTAL = /_experimental-snapshot/;
const INSTALLER = /-installer$/i;

export function whatProfile(id: string): ProfileType {
    if (
        MOJANG_NAME_RELEASE.test(id) ||
        MOJANG_NAME_SNAPSHOT.test(id) ||
        MOJANG_EXPERIMENTAL.test(id) ||
        MOJANG_OLD_AB.test(id) ||
        MOJANG_OLD_CX.test(id) ||
        MOJANG_OLD_RD.test(id) ||
        MOJANG_PRE_RC.test(id)
    ) {
        return ProfileType.MOJANG;
    }
    if (FABRIC_NAME.test(id)) {
        return ProfileType.FABRIC;
    }
    if (FORGE_NAME.test(id)) {
        return ProfileType.FORGE;
    }
    if (QUILT_NAME.test(id)) {
        return ProfileType.QUILT;
    }
    if (INSTALLER.test(id)) {
        return ProfileType.INSTALLER;
    }
    return ProfileType.UNIVERSAL;
}

export enum ProfileType {
    MOJANG = "Mojang",
    FORGE = "Forge",
    FABRIC = "Fabric",
    UNIVERSAL = "Universal",
    INSTALLER = "Installer",
    QUILT = "Quilt",
}

export function isLegacy(obj: Record<string, unknown>): boolean {
    if (!isNull(obj["minecraftArguments"])) {
        return true;
    }
    if (typeof obj["inheritsFrom"] === "string") {
        if (LEGACY_VERSIONS.test(obj["inheritsFrom"])) {
            return true;
        }
    }
    if (typeof obj["id"] === "string") {
        if (LEGACY_VERSIONS.test(obj["id"])) {
            return true;
        }
    }
    return false;
}

export function inferModLoaderVersionForge(id: string): string {
    return id.split("-").pop() || "";
}

const SEMVER_REGEX = /^0\.[0-9]+\.[0-9]+(\.[0-9+])?(\+build\.[0-9]+)?$/i; // Currently Fabric starts from 0

export function inferModLoaderVersionFabric(id: string): string {
    const a = id.split("-");
    for (const x of a) {
        if (SEMVER_REGEX.test(x)) {
            return x;
        }
    }
    return a[a.length - 2] || "";
}
