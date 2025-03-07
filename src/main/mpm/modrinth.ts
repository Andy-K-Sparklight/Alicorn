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
    version_id: string | null;
    project_id: string | null;
    dependency_type: "incompatible" | "required" | "optional" | "embedded";
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

async function resolveCandidateVersion(projId: string, gameVersion: string, loader: string): Promise<string | null> {
    const loaders = makeJSONParam([loader]);
    const gameVersions = makeJSONParam([gameVersion]);

    const v = await apiGet<ModrinthVersion[]>(
        `${API_URL}/project/${projId}/version?loaders=${loaders}&game_versions=${gameVersions}`
    );

    if (v.length === 0) {
        return null;
    }

    return v[0].id;
}

/**
 * Resolve the given MPM entries and returns files to download.
 *
 * The manifest may get modified when resolving.
 */
async function resolve(manifest: MpmManifest, gameVersion: string, loader: string, container: Container): Promise<DlxDownloadRequest[]> {
    const projectDependencies = new Map<string, Set<string>>();

    function addDependency(srcId: string, depId: string) {
        const deps = projectDependencies.get(srcId);
        if (deps) {
            deps.add(depId);
        } else {
            projectDependencies.set(srcId, new Set([depId]));
        }
    }

    const userPromptVersions = await Promise.all(manifest.userPrompt.map(async p => {
        if (p.version) {
            console.debug(`Picked up user-defined version ${p.version} for ${p.id}`);
            addDependency(p.id, p.version);
            return p.version;
        } else {
            const v = await resolveCandidateVersion(p.id, gameVersion, loader);
            if (!v) throw `No version available for ${p.id}`;

            console.debug(`Resolved candidate version ${v} for ${p.id}`);
            addDependency(p.id, v);
            return v;
        }
    }));


    const allVersions = new Set(userPromptVersions);

    // Resolve dependencies
    let currentCandidate = new Set(userPromptVersions);

    const versionFiles = new Map<string, ModrinthFile[]>();

    while (currentCandidate.size > 0) {
        const vs = makeJSONParam([...currentCandidate]);
        const versionMeta = await apiGet<ModrinthVersion[]>(`${API_URL}/versions?ids=${vs}`);

        // Collect files while resolving dependencies
        for (const vm of versionMeta) {
            versionFiles.set(vm.id, vm.files);
        }

        const depVersions = new Set<{ id: string, parent: string }>();
        const depProjects = new Set<{ id: string, parent: string }>();

        // TODO the dependency may specify a different file name
        for (const vm of versionMeta) {
            for (const d of vm.dependencies) {
                if (d.dependency_type === "required") {
                    if (d.version_id) {
                        depVersions.add({ id: d.version_id, parent: vm.id });
                    } else if (d.project_id) {
                        depProjects.add({ id: d.project_id, parent: vm.id });
                    }
                }
            }
        }

        // Resolve dependencies without a specific version

        await Promise.all(depProjects.values().map(async d => {
            // TODO perhaps add dependency project to manifest

            const { id: projId, parent } = d;

            const v = await resolveCandidateVersion(projId, gameVersion, loader);
            if (!v) throw `No version available for ${projId}`;

            if (!allVersions.has(v)) {
                depVersions.add({ id: v, parent });
            }
        }));

        for (const d of depVersions) {
            console.debug(`Adding dependency: ${d.id}`);
            addDependency(d.parent, d.id);
            allVersions.add(d.id);
        }

        currentCandidate = new Set(depVersions.values().map(d => d.id));
    }

    const flattenFiles = [...versionFiles.values()].flatMap(v => v);

    console.debug(`Confirmed ${flattenFiles.length} files from Modrinth.`);

    manifest.resolved = [...versionFiles.entries()].map(([v, f]) => {
        return {
            version: v,
            vendor: "modrinth",
            files: f.map(f => ({
                path: container.mod(f.filename), // TODO support other addon types
                sha1: f.hashes.sha1
            }))
        };
    });

    manifest.dependencies = Object.fromEntries(projectDependencies.entries().map(([src, deps]) => [src, [...deps]]));

    // Download files
    return flattenFiles.map(f => ({
        url: f.url,
        path: container.mod(f.filename), // TODO support other addon types
        sha1: f.hashes.sha1,
        size: f.size
    }));
}

export const modrinth = { search, resolve };
