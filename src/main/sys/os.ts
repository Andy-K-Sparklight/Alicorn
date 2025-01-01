import os from "os";

export type OSName = "windows" | "osx" | "linux";

/**
 * Gets the canonical name of the OS.
 */
export function getOSName(): OSName {
    switch (os.platform()) {
        case "win32":
            return "windows";
        case "darwin":
            return "osx";
        default:
            return "linux";
    }
}

/**
 * Gets the bits of the current OS.
 *
 * This method only affects Windows platform (used to select Twitch binaries).
 */
export function getOSBits(): string {
    if (os.arch() === "ia32") return "32";
    return "64";
}