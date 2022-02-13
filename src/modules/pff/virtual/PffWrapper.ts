import { copyFile, remove } from "fs-extra";
import { getBoolean, getString } from "../../config/ConfigSupport";
import { MinecraftContainer } from "../../container/MinecraftContainer";
import { DownloadMeta } from "../../download/AbstractDownloader";
import { wrappedDownloadFile } from "../../download/DownloadWrapper";
import { getCachedMod, saveModFileAsCache } from "./Cache";
import { loadLockfile, saveLockfile } from "./Lockfile";
import {
  AbstractModResolver,
  CurseforgeModResolver,
  CursePlusPlusModResolver,
  ModResolver,
  ModrinthModResolver,
} from "./Resolver";

const SLUG_SCOPE_REGEX = /(?<=@)(curseforge|modrinth|curseplusplus)(?=:.+?)/i;

export async function fetchModByName(
  slug: string,
  gameVersion: string,
  modLoader: "Fabric" | "Forge",
  container: MinecraftContainer
): Promise<boolean> {
  // slug can be '@Provider:Slug'
  // or even '@Provider:Main/Artifact'
  let scope;
  let sid;
  let mainId;
  let artifactId;
  if (SLUG_SCOPE_REGEX.test(slug)) {
    scope = (slug.match(SLUG_SCOPE_REGEX) || [])[0];
    sid = slug.split(":")[1] || "";
    const p = sid.split("/");
    if (p.length === 2) {
      [mainId, artifactId] = p;
      sid = null;
    }
  }
  slug = slug.toLowerCase();
  const slx = getResolvers(slug, scope);
  if (slx.length === 0) {
    return false;
  }
  let sx: AbstractModResolver | null = null;
  for (const c of slx) {
    try {
      if (mainId) {
        if (artifactId) {
          await c.setSelected(mainId, artifactId);
        }
      }
      if (sid) {
        await c.setSelected(sid, undefined); // Set id
      }
      await c.resolveMod();
      if (!sx) {
        sx = c; // Find the first as the best
      }
      if (c.cachedMeta?.slug === slug) {
        // Exactly then use
        sx = c;
        break;
      }
    } catch /* (e) */ {
      // console.log(e);
    }
  }
  if (!sx) {
    return false;
  }
  if (await fetchSelectedMod(sx, gameVersion, modLoader, container)) {
    return true;
  }

  const trs: Set<AbstractModResolver> = new Set();
  for (const c of slx) {
    try {
      if (c === sx) {
        sx = null;
        continue;
      }
      await c.resolveMod();
      trs.add(c);
    } catch /* (e) */ {
      // console.log(e);
    }
  }
  // If the best doesn't support, we guess that we shouldn't make more compares, just find one asap!
  // Those platforms with few mods won't be supported by Alicorn, so no worries!
  for (const c of Array.from(trs)) {
    if (await fetchSelectedMod(c, gameVersion, modLoader, container)) {
      return true;
    }
  }
  return false;
}

export async function fetchSelectedMod(
  rsv: ModResolver,
  gameVersion: string,
  modLoader: "Fabric" | "Forge",
  container: MinecraftContainer
): Promise<boolean> {
  const lf = await loadLockfile(container);
  try {
    if (!rsv.mainId) {
      return false;
    }
    if (await rsv.canSupport(gameVersion, modLoader)) {
      const a = await rsv.getArtifactFor(gameVersion, modLoader);
      for (const r of Object.values(lf)) {
        if (r.selectedArtifact.fileName === a.fileName) {
          return true; // Two mods, one file, do not override or write
        }
      }
      try {
        const pc = await getCachedMod(rsv.mainId, a.id);
        if (pc) {
          await copyFile(pc, container.getModJar(a.fileName));
          await rsv.writeLock(lf);
          await saveLockfile(lf, container);
          return true;
        }
      } catch (e) {
        console.log("Failed to provide cache for " + rsv.mainId + ": " + e);
      }
      const st = await wrappedDownloadFile(
        new DownloadMeta(
          a.downloadUrl,
          container.getModJar(a.fileName),
          a.hash,
          a.size
        ),
        true // Mod ln might cause exception
      );
      if (st === 1) {
        try {
          try {
            await saveModFileAsCache(
              container.getModJar(a.fileName),
              rsv.mainId,
              a.id
            );
          } catch (e) {
            console.log("Failed to save cache for " + rsv.mainId + ": " + e);
          }
          if (getString("pff.upgrade-mode") === "Override") {
            // Remove old
            for (const l of Object.values(lf)) {
              if (l.id === rsv.mainId) {
                if (hasSameObj(l.selectedArtifact.gameVersion, a.gameVersion)) {
                  await remove(
                    container.getModJar(l.selectedArtifact.fileName)
                  );
                }
                break;
              }
            }
          }
          await rsv.writeLock(lf);
          await saveLockfile(lf, container);
        } catch (e) {
          console.log(e);
        } // Lockfile doesn't really matter...
        return true;
      }
      console.log(`Could not fetch artifact: ` + a.downloadUrl);
      return false;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
    return false;
  }
}

function hasSameObj<T>(a: Array<T>, b: Array<T>): boolean {
  for (const o of a) {
    if (b.includes(o)) {
      return true;
    }
  }
  return false;
}

export function getResolvers(
  slug: string,
  scope?: string
): AbstractModResolver[] {
  if (scope) {
    scope = scope.toLowerCase();
  }
  if (scope === "curseforge") {
    if (getBoolean("pff.cursepp")) {
      return [new CursePlusPlusModResolver(slug)];
    } else {
      return [new CurseforgeModResolver(slug)];
    }
  }
  if (scope === "curseplusplus") {
    return [new CursePlusPlusModResolver(slug)];
  }
  if (scope === "modrinth") {
    return [new ModrinthModResolver(slug)];
  }
  if (getBoolean("pff.cursepp")) {
    return [new ModrinthModResolver(slug), new CursePlusPlusModResolver(slug)];
  } else {
    return [new ModrinthModResolver(slug), new CurseforgeModResolver(slug)];
  }
}

const PFF_FLAG = "Downloader.IsPff";

// Since args pop is very hard for downloaders
// We will use a flag to do this
// 1 - Use pff config
// Any other value - Use common config
export function setPffFlag(value: string): void {
  sessionStorage.setItem(PFF_FLAG, value);
}
