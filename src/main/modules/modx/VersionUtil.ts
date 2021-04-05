import semver from "semver";

interface TrimmedVersion {
  min?: string;
  max?: string;
  includeMin?: boolean;
  includeMax?: boolean;
}

function trimVersionRange(vstr: string): TrimmedVersion {
  let l = vstr.split(",");
  const tv: TrimmedVersion = {};
  if (l.length <= 1) {
    tv.max = tv.min = l[0] || "1.0.0";
    tv.includeMax = tv.includeMin = true;
    return tv;
  }
  l = l.map((v) => {
    return v.trim();
  });
  tv.min = l[0].slice(1);
  tv.max = l[1].slice(0, -1);
  tv.includeMin = !l[0].startsWith("(");
  tv.includeMax = !l[1].endsWith(")");
  return tv;
}

function cmpVersion(modVersion: TrimmedVersion, mcVersion: string): boolean {
  let pMax = "";
  if (modVersion.max !== "") {
    pMax = `<${modVersion.includeMax ? "=" : ""} ${modVersion.max}`;
  }
  let pMin = "";
  if (modVersion.min !== "") {
    pMin = `>${modVersion.includeMin ? "=" : ""} ${modVersion.min}`;
  }
  let final = "*";
  if (pMax === "") {
    if (pMin !== "") {
      final = pMin;
    }
  } else {
    if (pMin === "") {
      final = pMin;
    } else {
      final = `${pMin} && ${pMax}`;
    }
  }
  return semver.satisfies(mcVersion, final);
}

export function canModApply(mod: string, mc: string): boolean {
  return cmpVersion(trimVersionRange(mod), mc);
}
