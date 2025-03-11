import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { dlx } from "@/main/net/dlx";
import type { Library } from "@/main/profile/version-profile";
import { unwrapESM } from "@/main/util/module";
import type { ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import StreamZip from "node-stream-zip";
import path from "node:path";

async function loadCompat() {
    return await unwrapESM(import("@/refs/legacy-forge-compat.json"));
}

async function shouldUseVenv(v: string): Promise<boolean> {
    return (await loadCompat()).venv.includes(v);
}

async function getModLoaderUrl(v: string): Promise<string> {
    return (await loadCompat() as any)["mod-loader"][v] ?? "";
}

async function downloadModLoader(url: string, control?: ProgressController): Promise<string> {
    console.debug(`Fetching ModLoader from ${url}`);
    const fp = paths.temp.to(`mod-loader-${nanoid()}.jar`);
    await dlx.getAll([{ url, path: fp }], { signal: control?.signal });
    return fp;
}

async function getModLoaderDamtLibrary(): Promise<Library> {
    return (await loadCompat())["damt"];
}

async function getModLoaderDamtArg(): Promise<string> {
    return (await loadCompat())["damt-arg"];
}

async function patchProfile(container: Container, id: string) {
    console.debug(`Patching ${id} with DAMT...`);
    const prof = await fs.readJSON(container.profile(id));
    prof.libraries.push(await getModLoaderDamtLibrary());
    prof.minecraftArguments += (" " + await getModLoaderDamtArg());
    await fs.writeJSON(container.profile(id), prof);
}

async function shouldStripSignature(gameVersion: string): Promise<boolean> {
    return (await loadCompat()).stripSignature.includes(gameVersion);
}

async function stripSignature(fp: string): Promise<void> {
    console.debug(`Stripping signature of ${fp}`);

    const workDir = paths.temp.to(`forge-strip-sig-${nanoid()}`);
    let f: StreamZip.StreamZipAsync | null = null;
    try {
        f = new StreamZip.async({ file: fp });
        await fs.emptyDir(workDir);
        await f.extract(null, workDir);
    } finally {
        await f?.close();
    }
    await fs.remove(path.join(workDir, "META-INF"));

    await fs.remove(fp);

    const { zip } = await import("zip-a-folder");

    await zip(workDir, fp, { compression: 1 as any });
    await fs.remove(workDir);
}

export const forgeCompat = {
    shouldUseVenv,
    getModLoaderUrl,
    downloadModLoader,
    patchProfile,
    shouldStripSignature,
    stripSignature
};
