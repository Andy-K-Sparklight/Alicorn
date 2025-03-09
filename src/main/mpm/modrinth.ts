import type { MpmContext, MpmFile, MpmPackage, MpmPackageDependency, MpmPackageProvider } from "@/main/mpm/pm";
import { MpmPackageSpecifier } from "@/main/mpm/pm";
import type { MpmAddonMeta, MpmAddonType } from "@/main/mpm/spec";
import { netx } from "@/main/net/netx";
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
    return await netx.getJSON(url, getSession());
}

function makeJSONParam(obj: any): string {
    return encodeURIComponent(JSON.stringify(obj));
}

async function search(
    scope: MpmAddonType,
    query: string,
    gameVersion: string,
    loader: string,
    offset = 0
): Promise<MpmAddonMeta[]> {
    const facets = makeJSONParam([
        [`versions:${gameVersion}`],
        scope === "mods" && [`categories:${loader}`],
        [`project_type:${toModrinthType(scope)}`]
    ].filter(Boolean));

    const res = await apiGet<{ hits?: ModrinthProjectSlim[] }>(
        `${API_URL}/search?query=${query}&facets=${facets}&limit=50&offset=${offset}`
    );

    return (res.hits ?? []).map(toMpmAddonMeta);
}

async function requestProjects(projIds: string[]): Promise<ModrinthProject[]> {
    if (projIds.length === 0) return [];
    const ids = makeJSONParam(projIds);
    return apiGet<ModrinthProject[]>(`${API_URL}/projects?ids=${ids}`);
}

async function requestVersions(versionIds: string[]): Promise<ModrinthVersion[]> {
    if (versionIds.length === 0) return [];
    const vs = makeJSONParam(versionIds);
    return apiGet<ModrinthVersion[]>(`${API_URL}/versions?ids=${vs}`);
}

async function requestProjectVersions(projId: string, gameVersion: string, loader: string | null): Promise<ModrinthVersion[]> {
    const loadersParam = loader && makeJSONParam([loader]);
    const gameVersionsParam = makeJSONParam([gameVersion]);

    let url = `${API_URL}/project/${projId}/version?game_versions=${gameVersionsParam}`;
    if (loadersParam) {
        url += `&loaders=${loadersParam}`;
    }

    return await apiGet<ModrinthVersion[]>(url);
}

function toMpmFile(f: ModrinthFile): MpmFile {
    return {
        url: f.url,
        fileName: f.filename,
        size: f.size,
        sha1: f.hashes.sha1
    };
}

function toMpmType(t: ModrinthProjectType): MpmAddonType {
    switch (t) {
        case "mod":
            return "mods";
        case "resourcepack":
            return "resourcepacks";
        case "shader":
            return "shaderpacks";
        case "modpack":
            return "modpack";
    }
}

function toModrinthType(t: MpmAddonType): ModrinthProjectType {
    switch (t) {
        case "mods":
            return "mod";
        case "resourcepacks":
            return "resourcepack";
        case "shaderpacks":
            return "shader";
        case "modpack":
            return "modpack";
    }
}

function toMpmAddonMeta(proj: ModrinthProject | ModrinthProjectSlim): MpmAddonMeta {
    return {
        title: proj.title,
        id: "id" in proj ? proj.id : proj.project_id,
        vendor: "modrinth",
        author: proj.author,
        description: proj.description,
        icon: proj.icon_url ?? "",
        type: toMpmType(proj.project_type)
    };
}

export class ModrinthProvider implements MpmPackageProvider {
    vendorName = "modrinth";

    async resolve(specs: string[], ctx: MpmContext): Promise<MpmPackage[][]> {
        const cachedVersions = new Map<string, ModrinthVersion>();
        const projectMeta = new Map<string, ModrinthProject>();

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
                const shouldIncludeLoader = s.type === "mods" || s.type === "modpack";
                const versions = await requestProjectVersions(s.id, ctx.gameVersion, shouldIncludeLoader ? ctx.loader : null);
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

        // Collect projects
        const allProjects = await requestProjects([...new Set(cachedVersions.values().map(v => v.project_id))]);

        for (const proj of allProjects) {
            projectMeta.set(proj.id, proj);
        }

        function toMpmPackage(version: ModrinthVersion): MpmPackage {
            const proj = projectMeta.get(version.project_id)!;
            return {
                id: version.project_id,
                version: version.id,
                versionName: version.version_number,
                vendor: "modrinth",
                spec: `modrinth:${toMpmType(proj.project_type)}:${version.project_id}:${version.id}`,
                files: version.files.map(toMpmFile),
                dependencies: version.dependencies
                    .filter(d => d.project_id || d.version_id)
                    .filter(d => d.dependency_type === "required" || d.dependency_type === "incompatible")
                    .map(d => {
                        const projId = d.project_id || getCachedVersion(d.version_id!)?.project_id || "";
                        const versionId = d.version_id || ""; // Arbitrary version
                        const proj = projectMeta.get(projId);
                        const type = proj ? toMpmType(proj.project_type) : "mods";


                        return {
                            type: d.dependency_type === "required" ? "require" : "conflict",
                            spec: `modrinth:${type}:${projId}:${versionId}`
                        } satisfies MpmPackageDependency;
                    }),
                meta: toMpmAddonMeta(projectMeta.get(version.project_id)!)
            };
        }

        return possibleVersions.map(({ versions }) => versions
            .map(v => getCachedVersion(v)) // All versions have been resolved above
            .map(toMpmPackage)
        );
    }
}

export const modrinth = { search };
