import type { Container } from "@/main/container/spec";
import { nativeLib } from "@/main/profile/native-lib";
import { filterRules } from "@/main/profile/rules";
import type { VersionProfile } from "@/main/profile/version-profile";
import { unwrapESM } from "@/main/util/module";
import fs from "fs-extra";
import type streamZip from "node-stream-zip";
import path from "node:path";

let zl: typeof streamZip;

async function getLibrary(): Promise<typeof streamZip> {
    if (!zl) {
        zl = (await unwrapESM(import("node-stream-zip"))).default;
    }
    return zl;
}

async function unpackOne(lib: string, out: string, exclude?: string[]): Promise<void> {
    const z = await getLibrary();
    const filter = (p: string) => !(p.endsWith("/") || exclude?.some(e => p.startsWith(e)));
    const f = new z.async({ file: lib });

    try {
        const files = Object.values(await f.entries()).filter(ent => !ent.isDirectory && filter(ent.name));

        await Promise.all(files.map(async ent => {
            const t = path.join(out, ent.name);
            console.debug(`Extracting native artifact: ${lib} (${ent.name}) -> ${t}`);

            await fs.ensureDir(path.dirname(t));
            await f.extract(ent, t);
        }));
    } catch (e) {
        throw e;
    } finally {
        await f.close();
    }
}

async function unpack(profile: VersionProfile, container: Container, features: Set<string>): Promise<void> {
    const nativesRoot = container.nativesRoot(profile.id);
    const sources = profile.libraries.filter(l => filterRules(l.rules, features) && nativeLib.isNative(l));

    await Promise.all(sources.map(async s => {
        const name = nativeLib.getArtifactName(s);
        if (name) {
            await unpackOne(container.nativeLibrary(s.name, name), nativesRoot, s.extract?.exclude);
        }
    }));
}

export const nativesLint = { unpack };
