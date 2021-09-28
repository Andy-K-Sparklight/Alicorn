import { isNull, safeGet } from "../../commons/Null";
import { pgot } from "../../download/GotWrapper";
import { ModArtifact, ModMeta } from "../virtual/ModDefine";

export async function searchMetaBySlug(
  slug: string,
  apiBase: string,
  pageSize: number,
  timeout: number
): Promise<ModMeta[]> {
  const ACCESS_URL = apiBase + `/api/v1/mod?query=${slug}&limit=${pageSize}`;
  try {
    const r = await pgot(ACCESS_URL, timeout);
    const p = safeGet(r, ["hits"], []);
    if (p instanceof Array) {
      return p.map((r) => {
        return {
          id: String(r["mod_id"]).split("local-")[1] || "",
          displayName: String(r["title"]),
          thumbNail: String(r["icon_url"] || ""),
          provider: "Modrinth",
          slug: "", // This is NOT reliable! Modrinth already sorted them, so we will select the first one.
          supportVersions: r["versions"] || [],
        };
      });
    }
    return [];
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function getModMetaBySlug(
  slug: string,
  apiBase: string,
  timeout: number
): Promise<ModMeta | undefined> {
  const all = await searchMetaBySlug(slug, apiBase, 1, timeout);
  const ta = all[0];
  if (ta === undefined || isNull(ta.id)) {
    return undefined;
  }
  // Fetch enough information
  try {
    const ACCESS_URL = apiBase + `/api/v1/mod/${ta.id}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rs = (await pgot(ACCESS_URL, timeout)) as any;
    return {
      id: String(rs["id"]),
      supportVersions: ta.supportVersions,
      thumbNail: String(rs["icon_url"] || ""),
      slug: String(rs["slug"]),
      provider: "Modrinth",
      displayName: String(rs["title"]),
    };
  } catch (e) {
    console.log(e);
  }
}

export async function lookupModMetaInfo(
  id: string,
  apiBase: string,
  timeout: number
): Promise<ModMeta | undefined> {
  // Ugh! This is not effective!
  try {
    const ACCESS_URL = apiBase + `/api/v1/mod/${id}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rs = (await pgot(ACCESS_URL, timeout)) as any; // For other values
    const slug = String(rs["slug"]);
    const t = await getModMetaBySlug(slug, apiBase, timeout); // Only for support versions
    if (t === undefined) {
      return t;
    }
    return {
      id: String(rs["id"]),
      supportVersions: t.supportVersions,
      thumbNail: String(rs["icon_url"] || ""),
      slug: slug,
      provider: "Modrinth",
      displayName: String(rs["title"]),
    };
  } catch (e) {
    console.log(e);
  }
}

export async function getVersionListForMod(
  id: string,
  apiBase: string,
  timeout: number
): Promise<ModArtifact[]> {
  try {
    const ACCESS_URL = apiBase + `/api/v1/mod/${id}/version`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rs = (await pgot(ACCESS_URL, timeout)) as any; // For other values
    if (!(rs instanceof Array)) {
      return [];
    }
    const p: ModArtifact[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rs.forEach((c: any) => {
      const l = c["loaders"];
      if (!(l instanceof Array)) {
        return;
      }
      let m = 0;
      if (l.includes("fabric")) {
        m += 1;
      }
      if (l.includes("forge")) {
        m += 2;
      }
      if (m === 0) {
        return;
      }
      const f = c["files"];
      if (!(f instanceof Array)) {
        return;
      }
      if (!f[0]) {
        return;
      }
      p.push({
        id: String(c["id"]),
        modLoader: m === 1 ? "Fabric" : "Forge", // 3 is preserved, currently we haven't found a Forge and Fabric compatible mod
        gameVersion: c["game_versions"] || [],
        fileName: f[0]["filename"],
        hash: safeGet(f[0], ["hashes", "sha1"], undefined) as
          | string
          | undefined,
        downloadUrl: f[0]["url"],
      });
    });
    return p;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export function findCompatibleArtifact(
  versions: ModArtifact[],
  gameVersion: string,
  modLoader: "Fabric" | "Forge"
): ModArtifact | undefined {
  for (const a of versions) {
    if (a.modLoader === modLoader && a.gameVersion.includes(gameVersion)) {
      return a;
    }
  }
}
