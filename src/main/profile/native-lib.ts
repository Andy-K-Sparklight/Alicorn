import type { Library } from "@/main/profile/version-profile";
import { getOSBits, getOSName } from "@/main/sys/os";

/**
 * Check whether the given library is a native library (which requires unpacking).
 */
function isNative(l: Library): boolean {
    return l.natives !== undefined && getOSName() in l.natives;
}

/**
 * Gets the name of the native artifact.
 */
function getArtifactName(l: Library): string {
    const index = l.natives?.[getOSName()];
    if (!index) throw `Library ${l.name} has no native artifact for ${getOSName()}`;
    return index.replaceAll("${arch}", getOSBits());
}

export const nativeLib = { isNative, getArtifactName };