import * as fs from "node:fs/promises";
import * as path from "node:path";
import { app } from "electron";
import * as os from "node:os";

export function read(p: string) {
    return fs.readFile(p);
}

export function resolvePath(p: string[]) {
    return path.normalize(path.resolve(...p));
}

export async function write(s: Uint8Array, p: string) {
    const parent = path.dirname(p);
    await fs.mkdir(parent, { recursive: true });
    await fs.writeFile(p, s);
}

export function getResourcesRoot() {
    return app.getAppPath();
}

export function getDataRoot() {
    if (os.platform() == "darwin") {
        return path.join(os.homedir(), "Library/Application Support/Alicorn2");
    }

    let r: string;
    if ((r = process.env["LOCALAPPDATA"] || "")) return resolvePath([r, "Alicorn2"]);
    if ((r = process.env["APPDATA"] || "")) return resolvePath([r, "Alicorn2"]);

    return path.join(os.homedir(), ".alicorn2");
}