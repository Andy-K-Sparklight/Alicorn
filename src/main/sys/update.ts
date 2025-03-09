import { netx } from "@/main/net/netx";
import { windowControl } from "@/main/sys/window-control";
import { app, net } from "electron";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import StreamZip from "node-stream-zip";
import os from "node:os";
import path from "node:path";
import { Stream } from "node:stream";
import * as semver from "semver";
import pkg from "~/package.json";

function getVariableAppDir() {
    switch (os.platform()) {
        case "win32":
            return path.join(process.env["LOCALAPPDATA"] || process.env["APPDATA"] || os.homedir(), "Alicorn", "app");
        case "darwin":
            return path.join(os.homedir(), "Library", "Application Support", "Alicorn", "app");
        default:
            return path.join(os.homedir(), ".alicorn", "app");
    }
}

interface ReleasesMeta {
    latest: string;
    versions: Record<string, unknown>;
}

const RELEASES_URL = " https://jsr.io/@skjsjhb/alicorn-launcher/meta.json";

async function queryReleases(): Promise<ReleasesMeta> {
    const res = await net.fetch(RELEASES_URL);

    if (!res.ok) throw `Unable to query releases: ${res.status}`;

    return await res.json();
}

function findCompatibleAsset(meta: ReleasesMeta): [string, string] | null {
    const appBundleName = `app-bundle-${os.platform()}-${os.arch()}.zip`;

    const versions = Object.keys(meta.versions);

    for (const v of versions) {
        const cv = semver.clean(v, { loose: true });

        if (cv && semver.satisfies(cv, "^" + pkg.version) && semver.gt(cv, pkg.version)) {
            const url = `https://github.com/Andy-K-Sparklight/Alicorn/releases/download/v${v}/${appBundleName}`;
            return [url, cv];
        }
    }

    return null;
}

async function installAsset(url: string, ver: string): Promise<void> {
    console.log("Installing asset from: " + url);

    const res = await netx.get(url);

    if (!res.ok || !res.body) throw `Unable to fetch asset content: ${res.status}`;

    const tmpPath = path.join(app.getPath("temp"), `alicorn-update-${nanoid()}.zip`);
    const outStream = Stream.Writable.toWeb(fs.createWriteStream(tmpPath));
    await res.body.pipeTo(outStream as WritableStream<Uint8Array>);

    const dst = path.join(getVariableAppDir(), ver);
    await fs.emptyDir(dst);
    const zip = new StreamZip.async({ file: tmpPath });
    await zip.extract(null, dst);
    await fs.remove(tmpPath);

    // Create a lock in case the update was interrupted
    await fs.outputFile(path.join(dst, "install.lock"), "OK");
    console.log(`Installed asset for version ${ver}`);
}

async function runUpdate() {
    if (import.meta.env.AL_DEV || import.meta.env.AL_TEST) {
        console.log("Hot update is disabled in development mode.");
        return;
    }

    console.debug("Performing hot update.");

    try {
        const releases = await queryReleases();
        const a = findCompatibleAsset(releases);
        if (a) {
            const [am, ver] = a;
            console.debug(`Found updatable version: ${ver}`);
            await installAsset(am, ver);

            windowControl.getMainWindow()?.webContents.send("appUpgraded", ver);
        } else {
            console.log("This is already the latest version.");
        }
    } catch (e) {
        console.log(`Update failed: ${e}`);
    }
}

export const update = { getVariableAppDir, runUpdate };
