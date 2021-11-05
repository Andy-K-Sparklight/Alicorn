import semver from "semver";
import { GameProfile } from "../profile/GameProfile";
import { ProfileType, whatProfile } from "../profile/WhatProfile";

interface TrimmedVersion {
  min?: string;
  max?: string;
  includeMin?: boolean;
  includeMax?: boolean;
}

function trimV(s: string): string {
  while (s.startsWith("[") || s.startsWith("(")) {
    s = s.slice(1);
  }
  while (s.endsWith("]") || s.endsWith(")")) {
    s = s.slice(0, -1);
  }
  return s;
}

function trimVersionRange(vstr: string): TrimmedVersion {
  let l = vstr.split(",");
  const tv: TrimmedVersion = {};
  if (l.length <= 1) {
    tv.max = tv.min = trimV(l[0]) || "1.0.0";
    tv.includeMax = tv.includeMin = true;
    return tv;
  }
  l = l.map((v) => {
    return v.trim();
  });

  tv.min = semver.valid(semver.coerce(l[0])) || "";
  tv.max = semver.valid(semver.coerce(l[1])) || "";

  tv.includeMin = !l[0].startsWith("(");
  tv.includeMax = !l[1].endsWith(")");
  return tv;
}

function cmpVersion(
  modVersion: TrimmedVersion | string,
  mcVersion: string
): boolean {
  let pMax = "";
  const rules: string[] = [];
  if (typeof modVersion === "string") {
    rules.push(modVersion);
  } else {
    if (modVersion.max !== "" && modVersion.max !== "*") {
      pMax = `<${modVersion.includeMax ? "=" : ""} ${modVersion.max}`;
    }
    let pMin = "";
    if (modVersion.min !== "" && modVersion.min !== "*") {
      pMin = `>${modVersion.includeMin ? "=" : ""} ${modVersion.min}`;
    }
    if (pMax === "") {
      if (pMin !== "") {
        rules.push(pMin);
      }
    } else {
      if (pMin === "") {
        rules.push(pMax);
      } else {
        rules.push(pMax, pMin);
      }
    }
  }
  const cmc = semver.valid(semver.coerce(mcVersion));
  const s = rules.map((j) => {
    return semver.satisfies(cmc || "1.0.0", j);
  });
  return !s.includes(false);
}

export function canModVersionApply(
  mod: string,
  mc: string,
  notrans = false
): boolean {
  return cmpVersion(notrans ? mod : trimVersionRange(mod), mc);
}

export function gatherVersionInfo(profile: GameProfile): {
  type: ProfileType;
  version: string;
} {
  return { type: whatProfile(profile.id), version: profile.baseVersion };
}
