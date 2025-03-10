import type { Container } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { dlx } from "@/main/net/dlx";
import { netx } from "@/main/net/netx";
import { exceptions } from "@/main/util/exception";
import { progress, type ProgressController } from "@/main/util/progress";
import { session } from "electron";
import fs from "fs-extra";
import lazyValue from "lazy-value";
import { nanoid } from "nanoid";
import nodeHTML from "node-html-parser";
import child_process from "node:child_process";
import path from "node:path";
import { pEvent } from "p-event";

const VERSIONS_HTML = "https://optifine.net/downloads";

export interface OptiFineVersionMeta {
    gameVersion: string;
    name: string;
    htmlUrl: string;
    url: string;
    edition: string;
    stable: boolean;
}

let versions: OptiFineVersionMeta[] | null = null;

const FAKE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36";

const crawlSession = lazyValue(() => {
    const s = session.fromPartition(`temp:${nanoid()}`);
    s.setUserAgent(FAKE_USER_AGENT);
    return s;
});

interface BMCLAPIOptiFineVersion {
    mcversion: string;
    patch: string;
    type: string;
    filename: string;
}

async function syncVersionsFromBMCLAPI(): Promise<OptiFineVersionMeta[]> {
    const url = "https://bmclapi2.bangbang93.com/optifine/versionList";
    const vs = await netx.getJSON(url) as BMCLAPIOptiFineVersion[];
    return vs.map(v => ({
        gameVersion: v.mcversion,
        htmlUrl: "",
        url: `https://bmclapi2.bangbang93.com/maven/com/optifine/1.21.4/${v.filename}`,
        name: v.filename.replaceAll("preview_", "").replaceAll(".jar", ""),
        edition: v.type + "_" + v.patch,
        stable: v.filename.includes("preview")
    }));
}

async function crawlVersions(): Promise<OptiFineVersionMeta[]> {
    if (!versions) {
        try {
            versions = await syncVersionsFromBMCLAPI();
            return versions;
        } catch (e) {
            console.error(`Unable to sync OptiFine versions from BMCLAPI: ${e}`);
        }

        const v: OptiFineVersionMeta[] = [];

        const res = await crawlSession().fetch(VERSIONS_HTML);
        if (!res.ok) throw exceptions.create("network", { url: VERSIONS_HTML, code: res.status });

        const html = await res.text();

        const doc = nodeHTML(html, {
            blockTextElements: {
                style: false,
                script: false
            }
        });

        const entries = doc.querySelectorAll("tr.downloadLine");

        for (const ent of entries) {
            const htmlUrl = ent.querySelector("td.colMirror > a")?.attributes.href;

            if (!htmlUrl) continue;

            const rawName = URL.parse(htmlUrl)?.searchParams.get("f");

            const name = rawName?.replaceAll("preview_", "").replaceAll(".jar", "");
            const stable = !rawName?.includes("preview");

            // This seems naive, yet official installer does the same :)
            const gameVersion = name?.split("_")[1];
            const edition = name?.split("_").slice(2).join("_");

            if (!gameVersion || !name || !edition) continue;

            v.push({ gameVersion, name, htmlUrl, edition, stable, url: "" });
        }

        versions = v;
    }

    return versions;
}

async function getRealUrl(htmlUrl: string): Promise<string> {
    console.debug(`Identifying real URL of: ${htmlUrl}`);
    const res = await crawlSession().fetch(htmlUrl);
    if (!res.ok) throw exceptions.create("network", { url: htmlUrl, code: res.status });

    const html = await res.text();
    const doc = nodeHTML(html, {
        blockTextElements: {
            style: false,
            script: false
        }
    });

    const pathname = doc.querySelector("div.downloadButton > a")?.attributes?.href;
    if (!pathname) throw exceptions.create("network", { url: htmlUrl });

    const url = `https://optifine.net/${pathname}`;

    console.debug(`Found real URL: ${url}`);
    return url;
}

function genProfileId(name: string) {
    const ed = name.split("_").slice(2).join("_");
    const [_, gameVersion] = name.split("_");
    return `${gameVersion}-OptiFine_${ed}`;
}

async function hasVersion(gameVersion: string): Promise<boolean> {
    const versions = await crawlVersions();
    return versions.some(v => v.gameVersion === gameVersion);
}

async function pickVersion(gameVersion: string, version: string): Promise<[OptiFineVersionMeta, string]> {
    const versions = await crawlVersions();

    if (!version) {
        const v = versions.find(v => v.stable && v.gameVersion === gameVersion) ??
            versions.find(v => v.gameVersion === gameVersion);

        if (!v) throw exceptions.create("optifine-no-version", { gameVersion });

        console.debug(`Picked OptiFine version ${v.name}`);
        return [v, genProfileId(v.name)];
    }

    const uv = version.replaceAll("_", "").replaceAll(" ", "");

    const v = versions.find(vs => {
        if (vs.gameVersion === gameVersion) {
            const name = vs.name.replaceAll("_", "");
            if (name.includes(uv)) return true;
        }
    });

    if (!v) throw exceptions.create("optifine-no-version", { gameVersion });

    console.debug(`Picked OptiFine version ${v.name}`);
    return [v, genProfileId(v.name)];
}

async function downloadInstaller(meta: OptiFineVersionMeta, control?: ProgressController): Promise<string> {
    control?.onProgress?.(progress.indefinite("optifine.download"));

    const url = meta.url || await getRealUrl(meta.htmlUrl);
    console.debug(`Fetching OptiFine installer from: ${url}`);

    const fp = paths.temp.to(`optifine-installer-${nanoid()}.jar`);
    await dlx.getAll([{ url, path: fp, noCache: true }], { signal: control?.signal });

    return fp;
}

async function withFakeLauncherProfiles(container: Container, exec: () => Promise<void>): Promise<void> {
    const lp = container.launcherProfiles();
    const lpBak = lp + ".bak";

    try {
        await fs.move(lp, lpBak);
    } catch {}

    await fs.outputJSON(lp, { profiles: {} });

    try {
        await exec();
    } finally {
        try {
            await fs.remove(lp);
            await fs.move(lpBak, lp);
        } catch {}
    }
}

async function runInstaller(jrtExec: string, fp: string, container: Container, control?: ProgressController): Promise<void> {
    control?.onProgress?.(progress.indefinite("optifine.install"));

    const unfineJar = paths.app.to("vendor", "unfine-1.0.jar");

    await withFakeLauncherProfiles(container, async () => {
        console.debug(`Executing OptiFine installer at ${fp}`);

        const proc = child_process.spawn(jrtExec, [
            `-Dunfine.root=${container.props.root}`,
            "-cp",
            [fp, unfineJar].join(path.delimiter),
            "moe.skjsjhb.unfine.Reflector"
        ], { stdio: ["ignore", "inherit", "inherit"] });

        const code = await pEvent(proc, "exit");

        if (code !== 0) throw exceptions.create("optifine-install-failed", {});
    });
}

async function prefetch() {
    try {
        await crawlVersions();
    } catch {}
}

export const unfine = { prefetch, hasVersion, pickVersion, downloadInstaller, runInstaller };
