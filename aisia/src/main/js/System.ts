import * as os from "node:os";

export function getOsName(): string {
    switch (os.platform()) {
        case "win32":
            return "windows";
        case "darwin" :
            return "osx";
        default:
            return "linux";
    }
}

export function getOsArch(): string {
    return os.arch();
}

export function getOsVersion(): string {
    // Do not use os.version as it returns something like 'Wowdins 10'
    return os.release();
}