import { isNull } from "../commons/Null";

const JAR_SUFFIX = ".jar";
const SPOILER = ":";
const U_SEPARATOR = "/";
const LINKER = "-";
const DOT = /\./g;

export function convertFromFabric(
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
  if (!isNull(obj["url"])) {
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
  }
  return obj;
}

function makeURL(name: string, urlBase: string) {
  if (!urlBase.endsWith(U_SEPARATOR)) {
    urlBase += U_SEPARATOR;
  }
  return urlBase + makePath(name);
}

function makePath(name: string) {
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
