import { isNull } from "../commons/Null";

const FABRIC_NAME = /fabric/i;
const FORGE_NAME = /forge/i;
const MOJANG_NAME_RELEASE = /^[0-9]+?\.[0-9]+?(\.)?[0-9]*$/i;
const MOJANG_NAME_SNAPSHOT = /^[0-9]+?w[0-9]+?[a-z]$/i;
const LEGACY_VERSIONS = /^1\.([0-9]|1[0-2])([-.a-z].*?)?$/i;
const MOJANG_OLD_AB = /^[ab][0-9]+?\.[0-9]+?.*$/i;
const MOJANG_OLD_CX = /^c[0-9_.]+?[a-z]*?$/i;
const MOJANG_OLD_RD = /^rd-[0-9]+?$/i;
const MOJANG_PRE_RC = /^[0-9]+?\.[0-9]+?(\.)?[0-9]*-(pre|rc)[0-9]*$/i;

export function whatProfile(id: string): ProfileType {
  if (
    MOJANG_NAME_RELEASE.test(id) ||
    MOJANG_NAME_SNAPSHOT.test(id) ||
    MOJANG_OLD_AB.test(id) ||
    MOJANG_OLD_CX.test(id) ||
    MOJANG_OLD_RD.test(id) ||
    MOJANG_PRE_RC.test(id)
  ) {
    return ProfileType.MOJANG;
  }
  if (FABRIC_NAME.test(id)) {
    return ProfileType.FABRIC;
  }
  if (FORGE_NAME.test(id)) {
    return ProfileType.FORGE;
  }
  return ProfileType.UNIVERSAL;
}

export enum ProfileType {
  MOJANG = "Mojang",
  FORGE = "Forge",
  FABRIC = "Fabric",
  UNIVERSAL = "Universal",
}

export function isLegacy(obj: Record<string, unknown>): boolean {
  if (!isNull(obj["minecraftArguments"])) {
    return true;
  }
  if (typeof obj["inheritsFrom"] === "string") {
    if (LEGACY_VERSIONS.test(obj["inheritsFrom"])) {
      return true;
    }
  }
  if (typeof obj["id"] === "string") {
    if (LEGACY_VERSIONS.test(obj["id"])) {
      return true;
    }
  }
  return false;
}
