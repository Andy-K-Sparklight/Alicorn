import { getOSBits, getOSName } from "@/main/sys/os";
import type { Library } from "@/main/profile/version-profile";
import { MavenName } from "@/main/profile/maven-name";

/**
 * Check whether the given library is a native library (which requires unpacking).
 */
export function isNativeLibrary(l: Library): boolean {
    return l.natives !== undefined && getOSName() in l.natives;
}

/**
 * Gets the name of the native artifact.
 */
export function getNativeArtifactName(l: Library): string {
    const index = l.natives?.[getOSName()];
    if (!index) throw `Library ${l.name} has no native artifact for ${getOSName()}`;
    return index.replaceAll("${arch}", getOSBits());
}

/**
 * Gets the path to the native artifact (generated by the library name and the classifier).
 */
export function getNativeArtifactPath(l: Library): string {
    const nativeName = getNativeArtifactName(l);
    const name = new MavenName(l.name);
    name.classifier = nativeName;
    return name.toPath();
}
