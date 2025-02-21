import { netx } from "@/main/net/netx";
import { app, BrowserWindow, net } from "electron";
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

interface ReleaseMeta {
    tag_name: string;
    assets: AssetMeta[];
}

interface AssetMeta {
    name: string;
    browser_download_url: string;
}

const RELEASES_URL = "https://get-alicorn-release.skjsjhb.workers.dev";

async function queryReleases(): Promise<ReleaseMeta[]> {
    const res = await net.fetch(RELEASES_URL);

    if (!res.ok) throw `Unable to query releases: ${res.status}`;

    return await res.json();
}

function findCompatibleAsset(meta: ReleaseMeta[]): [AssetMeta, string] | null {
    const appBundleName = `app-bundle-${os.platform()}-${os.arch()}.zip`;

    for (const m of meta) {
        if (!m.tag_name.startsWith("v")) continue;
        const cv = semver.clean(m.tag_name, { loose: true });

        if (cv && semver.satisfies(cv, "^" + pkg.version) && semver.gt(cv, pkg.version)) {
            const a = m.assets.find(a => a.name === appBundleName);
            if (a) return [a, cv];
        }
    }

    return null;
}

async function installAsset(am: AssetMeta, ver: string): Promise<void> {
    const url = am.browser_download_url;

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

            BrowserWindow.getAllWindows().forEach(w => w.webContents.send("appUpgraded", ver));
        } else {
            console.log("This is already the latest version.");
        }
    } catch (e) {
        console.log(`Update failed: ${e}`);
    }
}

export const update = { getVariableAppDir, runUpdate };
