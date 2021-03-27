const FABRIC_NAME = /.*fabric.*/i;
const FORGE_NAME = /.*forge.*/i;
const MOJANG_NAME_RELEASE = /^[0-9]+?\.[0-9]+?(\.)?[0-9]*$/i;
const MOJANG_NAME_SNAPSHOT = /^[0-9]+?w[0-9]+?[a-z]/i;

export function whatProfile(obj: Record<string, unknown>): ProfileType {
  const id = String(obj["id"]);
  if (MOJANG_NAME_RELEASE.test(id) || MOJANG_NAME_SNAPSHOT.test(id)) {
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

enum ProfileType {
  MOJANG,
  FORGE,
  FABRIC,
  UNIVERSAL,
}

export { ProfileType };
