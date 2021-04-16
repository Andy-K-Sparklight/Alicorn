import semver from "semver";
import { GameProfile } from "../profile/GameProfile";
import { ProfileType, whatProfile } from "../profile/WhatProfile";

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
  tv.min = semver.valid(semver.coerce(l[0].slice(1))) || "1.0.0";
  tv.max = semver.valid(semver.coerce(l[1].slice(0, -1))) || "1.0.0";

  tv.includeMin = !l[0].startsWith("(");
  tv.includeMax = !l[1].endsWith(")");
  return tv;
}

function cmpVersion(modVersion: TrimmedVersion, mcVersion: string): boolean {
  let pMax = "";
  if (modVersion.max !== "" && modVersion.max !== "*") {
    pMax = `<${modVersion.includeMax ? "=" : ""} ${modVersion.max}`;
  }
  let pMin = "";
  if (modVersion.min !== "" && modVersion.min !== "*") {
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
  return semver.satisfies(
    semver.valid(semver.coerce(mcVersion)) || "1.0.0",
    final
  );
}

export function canModVersionApply(mod: string, mc: string): boolean {
  return cmpVersion(trimVersionRange(mod), mc);
}

export function gatherVersionInfo(
  profile: GameProfile
): { type: ProfileType; version: string } {
  return { type: whatProfile(profile.id), version: profile.baseVersion };
}
