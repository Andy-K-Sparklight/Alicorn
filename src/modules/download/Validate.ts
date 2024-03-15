import { stat } from "fs-extra";
import { invokeWorker } from "../../renderer/Schedule";
import { getBoolean } from "../config/ConfigSupport";

export async function validate(
    file: string,
    expected: string,
    size = 0
): Promise<boolean> {
    if (getBoolean("download.skip-validate")) {
        return await sizeValidate(file, size);
    }
    const actual = await getHash(file);
    if (actual.trim().toLowerCase() === expected.trim().toLowerCase()) {
        return true;
    }
    return false;
}

export async function getHash(f: string): Promise<string> {
    return String(await invokeWorker("Sha1File", f));
}

async function sizeValidate(f: string, size: number): Promise<boolean> {
    if (size <= 0) {
        return true;
    }
    try {
        const s = await stat(f);
        return s.size === size;
    } catch {
        return false;
    }
}
