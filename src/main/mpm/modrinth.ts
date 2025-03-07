import { conf } from "@/main/conf/conf";
import type { Container } from "@/main/container/spec";
import type { MpmManifest } from "@/main/mpm/manifest";
import { type DlxDownloadRequest } from "@/main/net/dlx";
import { exceptions } from "@/main/util/exception";
import { session } from "electron";
import lazyValue from "lazy-value";
import { nanoid } from "nanoid";
import pkg from "~/package.json";

const API_URL = "https://api.modrinth.com/v2";

const getSession = lazyValue(() => {
    const s = session.fromPartition(`temp:${nanoid()}`);
    // Set this user agent for Modrinth to recognize us
    s.setUserAgent(`Andy-K-Sparklight/Alicorn/${pkg.version} (skjsjhb@outlook.com)`);
    return s;
});

type ModrinthProjectType = "mod" | "modpack" | "resourcepack" | "shader";

interface ModrinthProjectSlim {
    slug: string;
    project_id: string;
    title: string;
    description: string;
    categories: string[]; // Possibly with loaders

    project_type: ModrinthProjectType;
    icon_url?: string;
    color?: number;
    author: string;
    versions: string[];
}

interface ModrinthProject {
    slug: string;
    id: string;
    title: string;
    description: string;
    categories: string[]; // Without loaders

    loaders: string[];
    project_type: ModrinthProjectType;
    icon_url?: string;
    color?: number;
    author: string;
    versions: string[];
}

interface ModrinthVersion {
    id: string;
    version_number: string;
    dependencies: ModrinthDependency[];
    files: ModrinthFile[];
}

interface ModrinthDependency {
    version_id: string;
}

interface ModrinthFile {
    hashes: Record<string, string>;
    url: string;
    filename: string;
    size: number;
}

async function apiGet<T = any>(url: string): Promise<T> {
    const signal = AbortSignal.timeout(conf().net.requestTimeout);
    const res = await getSession().fetch(url, { signal });

    if (!res.ok) throw exceptions.create("network", { url, code: res.status });

    return await res.json() as T;
}

function makeJSONParam(obj: any): string {
    return encodeURIComponent(JSON.stringify(obj));
}

async function search(query: string, gameVersion: string, loader: string, offset = 0): Promise<ModrinthProjectSlim[]> {
    const facets = makeJSONParam([
        [`versions:${gameVersion}`],
        [`categories:${loader}`],
        [`project_type:mod`] // TODO support other addons
    ]);

    const res = await apiGet<{ hits?: ModrinthProjectSlim[] }>(
        `${API_URL}/search?query=${query}&facets=${facets}&limit=50&offset=${offset}`
    );

    return res.hits ?? [];
}

/**
 * Resolve the given MPM entries and returns files to download.
 *
 * The manifest may get modified when resolving.
 */
async function resolve(manifest: MpmManifest, gameVersion: string, loader: string, container: Container): Promise<DlxDownloadRequest[]> {
    const ent = manifest.contents;
    const versions = new Set(ent.filter(e => !!e.version).map(e => e.version) as string[]);

    // Query version information for unresolved entries
    await Promise.all(ent.map(async e => {
        if (!e.version) {
            const loaders = makeJSONParam([loader]);
            const gameVersions = makeJSONParam([gameVersion]);
            const v = await apiGet<ModrinthVersion[]>(
                `${API_URL}/project/${e.id}/version?loaders=${loaders}&game_versions=${gameVersions}`
            );

            if (v.length === 0) {
                console.warn(`No version available for entry ${e.id}, skipped. (This may cause problems)`);
                return;
            }

            console.debug(`Resolved candidate version ${v[0].id} for ${e.id}`);
            versions.add(v[0].id);
        }
    }));

    // Resolve dependencies
    let currentCandidate = [...versions];

    const files: ModrinthFile[] = [];

    while (currentCandidate.length > 0) {
        const vs = makeJSONParam(currentCandidate);
        const versionMeta = await apiGet<ModrinthVersion[]>(`${API_URL}/versions?ids=${vs}`);
        const deps = versionMeta.flatMap(v => v.dependencies.map(d => d.version_id));

        // Collect files while resolving dependencies
        files.push(...versionMeta.flatMap(v => v.files));

        for (const d of deps) {
            console.debug(`Adding dependency: ${d}`);
            versions.add(d);
        }
        currentCandidate = deps;
    }

    console.debug(`Confirmed ${files.length} files from Modrinth.`);

    manifest.localFiles = files.map(f => ({
        path: container.mod(f.filename), // TODO support other addon types
        sha1: f.hashes.sha1
    }));

    // Download files
    return files.map(f => ({
        url: f.url,
        path: container.mod(f.filename), // TODO support other addon types
        sha1: f.hashes.sha1,
        size: f.size
    }));
}

export const modrinth = { search, resolve };
