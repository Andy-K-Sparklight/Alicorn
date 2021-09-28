export interface ModMeta {
  provider: "Modrinth" | "Curseforge";
  id: string;
  slug: string;
  displayName: string;
  thumbNail: string;
  supportVersions: string[];
}

export interface ModArtifact {
  modLoader: "Fabric" | "Forge";
  id: string;
  gameVersion: string[];
  downloadUrl: string;
  hash?: string;
  size?: number;
  fileName: string;
}
