import type { Library, LibraryArtifact } from "@/main/profile/version-profile";
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
function getArtifactName(l: Library): string | null {
    const index = l.natives?.[getOSName()];
    return index?.replaceAll("${arch}", getOSBits()) ?? null;
}

/**
 * Gets the artifact of the native library.
 */
function getArtifact(l: Library): LibraryArtifact | null {
    const name = getArtifactName(l);

    if (name) {
        return l.downloads?.classifiers?.[name] ?? null;
    }

    return null;
}

export const nativeLib = { isNative, getArtifactName, getArtifact };
