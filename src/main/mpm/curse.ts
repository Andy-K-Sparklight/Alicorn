import { type MpmPackageProvider } from "@/main/mpm/pm";
import {
    type MpmAddonMeta,
    type MpmAddonType,
    type MpmContext,
    type MpmPackage,
    MpmPackageSpecifier
} from "@/main/mpm/spec";
import { netx } from "@/main/net/netx";

const API_BASE = "https://api.curse.tools/v1/cf";

interface CurseProject {
    id: number;
    classId: number; // 6-mod 6552-shader 4471-modpack 12-resourcepacks
    name: string;
    slug: string;
    authors: { name: string }[];
    summary: string;
    logo: {
        thumbnailUrl: string;
        url: string
    };
}

interface CurseDependency {
    modId: number;
    relationType: number; // 3-required, 5-incompatible
}

interface CurseVersion {
    id: number;
    modId: number;
    displayName: string;
    fileName: string;
    fileDate: string;
    downloadUrl: string;
    gameVersions: string[];
    dependencies: CurseDependency[];
}

function toCurseLoader(loader: string): number {
    switch (loader) {
        case "forge":
            return 1;
        case "liteloader":
            return 3;
        case "fabric":
            return 4;
        case "quilt":
            return 5;
        case "neoforged":
            return 6;
    }

    return 0;
}

function sortVersions(arr: CurseVersion[]) {
    arr.sort((a, b) => {
        const d1 = new Date(a.fileDate);
        const d2 = new Date(b.fileDate);
        return d2.getTime() - d1.getTime();
    });
}

async function requestProjectVersions(projId: number, gameVersion: string, loader: string | null): Promise<CurseVersion[]> {
    let index = 0;
    const out: CurseVersion[] = [];

    while (true) {
        let url = `${API_BASE}/mods/${projId}/files?gameVersion=${gameVersion}&index=${index}`;

        if (loader) {
            url += `&modLoaderType=${toCurseLoader(loader)}`;
        }

        const res = await netx.getJSON(url) as { data: CurseVersion[] };

        out.push(...res.data);
        if (res.data.length < 50) break;
        index += 50;
    }

    // API mirrors may return the data in any order
    // MPM requires the latest version on the very top
    sortVersions(out);
    return out;
}

async function requestVersions(versionIds: number[]): Promise<CurseVersion[]> {
    if (versionIds.length === 0) return [];
    if (versionIds.length === 1) {
        // Use GET version of API as it's usually cached by upstream
        const v = versionIds[0];
        const url = `${API_BASE}/mods/files/${v}`;
        const rp = await netx.getJSON(url) as { data: CurseVersion };
        return [rp.data];
    } else {
        const url = `${API_BASE}/mods/files`;
        const rp = await netx.getJSON(url, { fileIds: versionIds }) as { data: CurseVersion[] };
        return rp.data;
    }
}

async function requestProjects(projIds: number[]): Promise<CurseProject[]> {
    if (projIds.length === 0) return [];
    if (projIds.length === 1) {
        const p = projIds[0];
        const url = `${API_BASE}/mods/${p}`;
        const rp = await netx.getJSON(url) as { data: CurseProject };
        return [rp.data];
    } else {
        const url = `${API_BASE}/mods`;
        const rp = await netx.getJSON(url, { modIds: projIds }) as { data: CurseProject[] };
        return rp.data;
    }
}


function toMpmAddonMeta(proj: CurseProject): MpmAddonMeta {
    return {
        id: proj.id.toString(),
        title: proj.name,
        vendor: "curse",
        description: proj.summary,
        icon: proj.logo.thumbnailUrl,
        type: toMpmType(proj.classId),
        author: proj.authors.map(a => a.name).join(", ")
    };
}

const projectMetaCache = new Map<number, CurseProject>();

function toCurseClassId(type: MpmAddonType): number {
    switch (type) {
        case "mods":
            return 6;
        case "modpack":
            return 4471;
        case "resourcepacks":
            return 12;
        case "shaderpacks":
            return 6552;
    }
}

function toMpmType(classId: number): MpmAddonType {
    switch (classId) {
        case 6:
            return "mods";
        case 4471:
            return "modpack";
        case 12:
            return "resourcepacks";
        case 6552:
            return "shaderpacks";
    }

    throw `Unrecognized class ID: ${classId}`;
}

async function search(scope: MpmAddonType, query: string, gameVersion: string, loader: string, index = 0): Promise<MpmAddonMeta[]> {
    const cl = toCurseLoader(loader);
    const q = encodeURIComponent(query);
    const cz = toCurseClassId(scope);
    let url = `${API_BASE}/mods/search?gameId=432&searchFilter=${q}&classId=${cz}&gameVersion=${gameVersion}&index=${index}&sortField=6`;

    if (scope === "mods") {
        url += `&modLoaderType=${cl}`;
    }

    try {
        const rp = await netx.getJSON(url) as { data: CurseProject[] };
        rp.data.forEach(p => projectMetaCache.set(p.id, p));
        return rp.data.map(toMpmAddonMeta);
    } catch (e) {
        console.error("Unable to generate search result");
        console.error(e);
        return [];
    }
}

export class CurseProvider implements MpmPackageProvider {
    vendorName = "curse";

    async resolve(specs: string[], ctx: MpmContext): Promise<MpmPackage[][]> {
        const cachedVersions = new Map<number, CurseVersion>();

        function getCachedVersion(versionId: number): CurseVersion {
            const v = cachedVersions.get(versionId);
            if (!v) {
                throw `Version ${versionId} not found in cache`;
            }
            return v!;
        }

        function cacheVersion(v: CurseVersion) {
            cachedVersions.set(v.id, v);
        }

        const possibleVersions: {
            spec: string,
            versions: number[]
        }[] = await Promise.all(
            specs.map(async spec => {
                const s = new MpmPackageSpecifier(spec);
                if (s.version) {
                    return { spec, versions: [parseInt(s.version, 10)] };
                } else {
                    const shouldIncludeLoader = s.type === "mods" || s.type === "modpack";
                    const versions = await requestProjectVersions(parseInt(s.id, 10), ctx.gameVersion, shouldIncludeLoader ? ctx.loader : null);
                    versions.forEach(cacheVersion);

                    return { spec, versions: versions.map(v => v.id) };
                }
            })
        );

        const missingVersions = possibleVersions.flatMap(v => v.versions).filter(vi => !cachedVersions.has(vi));

        (await requestVersions(missingVersions)).forEach(cacheVersion);

        // Collect projects
        const allProjects = await requestProjects(Array.from(new Set(
            cachedVersions.values().map(v => v.modId).filter(p => !projectMetaCache.has(p))
        )));

        for (const proj of allProjects) {
            projectMetaCache.set(proj.id, proj);
        }

        function toMpmPackage(v: CurseVersion): MpmPackage {
            const proj = projectMetaCache.get(v.modId)!;
            const tp = toMpmType(proj.classId);
            return {
                id: v.modId.toString(),
                version: v.id.toString(),
                versionName: v.displayName,
                vendor: "curse",
                spec: `curse:${tp}:${v.modId}:${v.id}`,
                meta: toMpmAddonMeta(proj),
                files: [{ url: v.downloadUrl, fileName: v.fileName }],
                dependencies: v.dependencies
                    .filter(d => d.relationType === 3 || d.relationType === 5)
                    .map(d => ({
                        // Curseforge has no version-only dependency
                        type: d.relationType === 3 ? "require" : "conflict",
                        spec: `curse:${tp}:${d.modId}:`
                    }))
            };
        }

        return possibleVersions.map(({ versions }) => versions
            .map(v => getCachedVersion(v)) // All versions have been resolved above
            .map(toMpmPackage)
        );
    }
}

export const curse = { search };
