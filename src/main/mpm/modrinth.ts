import { conf } from "@/main/conf/conf";
import type { MpmContext, MpmFile, MpmPackage, MpmPackageDependency, MpmPackageProvider } from "@/main/mpm/pm";
import { MpmPackageSpecifier } from "@/main/mpm/pm";
import { exceptions } from "@/main/util/exception";
import { isTruthy } from "@/main/util/misc";
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
    project_id: string;
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

async function requestVersions(versionIds: string[]): Promise<ModrinthVersion[]> {
    const vs = makeJSONParam(versionIds);
    return apiGet<ModrinthVersion[]>(`${API_URL}/versions?ids=${vs}`);
}

async function requestProjectVersions(projId: string, gameVersion: string, loader: string): Promise<ModrinthVersion[]> {
    const loadersParam = makeJSONParam([loader]);
    const gameVersionsParam = makeJSONParam([gameVersion]);

    return await apiGet<ModrinthVersion[]>(
        `${API_URL}/project/${projId}/version?loaders=${loadersParam}&game_versions=${gameVersionsParam}`
    );
}

function toMpmFile(f: ModrinthFile): MpmFile {
    return {
        url: f.url,
        fileName: f.filename,
        size: f.size,
        sha1: f.hashes.sha1
    };
}

export class ModrinthProvider implements MpmPackageProvider {
    vendorName = "modrinth";

    async resolve(specs: string[], ctx: MpmContext): Promise<MpmPackage[][]> {
        const cachedVersions = new Map<string, ModrinthVersion>();

        function getCachedVersion(versionId: string): ModrinthVersion {
            const v = cachedVersions.get(versionId);
            if (!v) {
                throw `Version ${versionId} not found in cache`;
            }
            return v!;
        }

        function cacheVersion(v: ModrinthVersion) {
            cachedVersions.set(v.id, v);
        }

        // Enumerate possible versions
        const possibleVersions: {
            spec: string,
            versions: string[]
        }[] = await Promise.all(specs.map(async spec => {
            const s = new MpmPackageSpecifier(spec);
            if (s.version) {
                return { spec, versions: [s.version] };
            } else {
                const versions = await requestProjectVersions(s.id, ctx.gameVersion, ctx.loader);
                versions.forEach(cacheVersion);

                return { spec, versions: versions.map(v => v.id) };
            }
        }));

        // Process unresolved versions
        const missingVersions = possibleVersions.flatMap(v => v.versions).filter(vi => !cachedVersions.has(vi));

        (await requestVersions(missingVersions)).forEach(cacheVersion);

        // Collect dependencies
        const allDeps = cachedVersions.values().flatMap(v => v.dependencies).filter(d => d.dependency_type === "required");
        const versionOnlyDeps = allDeps.filter(d => d.version_id && !d.project_id)
            .map(d => d.version_id!)
            .filter(v => !cachedVersions.has(v));


        (await requestVersions([...versionOnlyDeps])).forEach(cacheVersion);

        function toMpmPackage(version: ModrinthVersion): MpmPackage {
            return {
                id: version.project_id,
                version: version.id,
                vendor: "modrinth",
                spec: `modrinth:${version.project_id}:${version.id}`,
                files: version.files.map(toMpmFile),
                dependencies: version.dependencies
                    .filter(d => d.project_id || d.version_id)
                    .filter(d => d.dependency_type === "required" || d.dependency_type === "incompatible")
                    .map(d => {
                        const projId = d.project_id || getCachedVersion(d.version_id!)?.project_id || "";
                        const versionId = d.version_id || ""; // Arbitrary version

                        return {
                            type: d.dependency_type === "required" ? "require" : "conflict",
                            spec: `modrinth:${projId}:${versionId}`
                        } satisfies MpmPackageDependency;
                    }).filter(isTruthy)
            };
        }

        return possibleVersions.map(({ versions }) => versions
            .map(v => getCachedVersion(v)) // All versions have been resolved above
            .map(toMpmPackage)
        );
    }
}

export const modrinth = { search };
