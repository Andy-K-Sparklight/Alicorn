import path from "path-browserify";

export async function read(p: string) {
    return new Uint8Array(await Neutralino.filesystem.readBinaryFile(p));
}

export function write(p: string, s: Uint8Array) {
    return Neutralino.filesystem.writeBinaryFile(p, s.buffer);
}

export function resolvePath(p: string[]) {
    const pt = path.normalize(path.join(...p)).replace(/\\/g, "/");
    if (pt.startsWith("/") || pt.split("/")[0].endsWith(":")) {
        return pt; // Absolute
    }
    return path.normalize(path.join(NL_CWD.replace(/\\/g, "/"), pt));
}

export async function getDataRoot() {
    if (NL_OS == "Darwin") {
        return path.join(await Neutralino.os.getEnv("HOME"), "Library/Application Support/Alicorn2");
    }

    let r: string;
    if ((r = await Neutralino.os.getEnv("LOCALAPPDATA") || "")) return resolvePath([r, "Alicorn2"]);
    if ((r = await Neutralino.os.getEnv("APPDATA") || "")) return resolvePath([r, "Alicorn2"]);
    return path.join(await Neutralino.os.getEnv("USERPROFILE") || await Neutralino.os.getEnv("HOME"), ".alicorn2");
}