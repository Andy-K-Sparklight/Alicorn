import path from "path";
import { isNull, safeGet } from "../commons/Null";
const JAR_SUFFIX = ".jar";
const SPOILER = ":";
const U_SEPARATOR = "/";
const LINKER = "-";
const DOT = /\./g;

export function convertLibsByName(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const all = obj["libraries"];

  if (all instanceof Array) {
    const tAll = all.concat();
    obj["libraries"] = tAll.map(makeLibrary);
  }
  return obj;
}

export function makeLibrary(
  obj: Record<string, unknown>
): Record<string, unknown> {
  // DONE safe
  if (
    !isNull(safeGet(obj, ["downloads", "artifact", "url"])) &&
    !isNull(safeGet(obj, ["downloads", "artifact", "path"]))
  ) {
    return obj; // This should work... ?
  }
  if (!isNull(obj["url"])) {
    // This url is only a root
    const name = String(obj["name"]) || "";
    return {
      name: name,
      downloads: {
        artifact: {
          path: makePath(name),
          url: makeURL(name, String(obj["url"]) || ""),
          sha1: "",
          size: 0,
        },
      },
    };
  } else {
    // Url is https://libraries.minecraft.net/
    const name = String(obj["name"]) || "";
    return {
      name: name,
      downloads: {
        artifact: {
          path: makePath(name),
          url: makeURL(name, "https://libraries.minecraft.net"),
          sha1: "",
          size: 0,
        },
      },
    };
  }
}

const KNOWN_EXTS: string[] = [
  ".jar",
  ".zip",
  ".tgz",
  ".tar",
  ".ald",
  ".gz",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".mca",
  ".dat",
  ".png",
  ".jpg",
  ".jpeg",
  ".dat_old",
  ".lock",
  ".gif",
  ".ico",
  ".txt",
  ".log",
  ".md",
];

function makeURL(name: string, urlBase: string) {
  try {
    if (urlBase.length > 0) {
      if (!urlBase.endsWith("/")) {
        const u = new URL(urlBase);
        const ext = path.extname(u.pathname);
        if (KNOWN_EXTS.includes(ext.toLowerCase())) {
          return urlBase;
        }
      }
    }
  } catch {}
  if (!urlBase.endsWith(U_SEPARATOR)) {
    urlBase += U_SEPARATOR;
  }
  return urlBase + makePath(name);
}

export function makePath(name: string): string {
  try {
    const spt = name.split(SPOILER);
    if (spt.length < 3) {
      // This should not happen!
      return "";
    }
    const p = spt[0];
    const n = spt[1];
    const v = spt[2];
    return [
      p.replace(DOT, U_SEPARATOR),
      n,
      v,
      n + LINKER + v + JAR_SUFFIX,
    ].join(U_SEPARATOR);
  } catch {
    return "";
  }
}
