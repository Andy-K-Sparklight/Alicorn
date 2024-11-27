import path from "path";
import { isNull, safeGet } from "../commons/Null";

export function convertLibsByName(
    obj: Record<string, unknown>
): Record<string, unknown> {
    const all = obj["libraries"];

    if (all instanceof Array) {
        const tAll = all.concat();
        obj["libraries"] = tAll.map(makeLibrary);
    }
    return obj;
}

export function makeLibrary(
    obj: Record<string, unknown>
): Record<string, unknown> {
    // DONE safe
    if (
        !isNull(safeGet(obj, ["downloads", "artifact", "url"])) &&
        !isNull(safeGet(obj, ["downloads", "artifact", "path"]))
    ) {
        return obj; // This should work... ?
    }
    if (!isNull(obj["url"])) {
        // This url is only a root
        const name = String(obj["name"]) || "";
        return {
            name: name,
            downloads: {
                artifact: {
                    path: getLibraryPathByName(name),
                    url: getLibraryURLByName(name, String(obj["url"]) || ""),
                    sha1: "",
                    size: 0
                }
            }
        };
    } else {
        // Url is https://libraries.minecraft.net/
        const name = String(obj["name"]) || "";
        return {
            name: name,
            downloads: {
                artifact: {
                    path: getLibraryPathByName(name),
                    url: getLibraryURLByName(name, "https://libraries.minecraft.net"),
                    sha1: "",
                    size: 0
                }
            }
        };
    }
}

const KNOWN_EXTS: string[] = [
    ".jar",
    ".zip",
    ".tgz",
    ".tar",
    ".ald",
    ".gz",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".mca",
    ".dat",
    ".png",
    ".jpg",
    ".jpeg",
    ".dat_old",
    ".lock",
    ".gif",
    ".ico",
    ".txt",
    ".log",
    ".md"
];

function getLibraryURLByName(name: string, urlBase: string) {
    try {
        if (urlBase.length > 0) {
            if (!urlBase.endsWith("/")) {
                const u = new URL(urlBase);
                const ext = path.extname(u.pathname);
                if (KNOWN_EXTS.includes(ext.toLowerCase())) {
                    return urlBase;
                }
            }
        }
    } catch {}
    if (!urlBase.endsWith("/")) {
        urlBase += "/";
    }
    return urlBase + getLibraryPathByName(name);
}

export function getLibraryPathByName(name: string): string {
    const [main, ext] = name.split("@");
    const [group, artifact, version, classifier] = main.split(":");
    let jarName = `${artifact}-${version}`;
    if (classifier) {
        jarName += `-${classifier}`;
    }
    return `${group.replaceAll(".", "/")}/${artifact}/${version}/${jarName}.${ext || "jar"}`;
}
