import { ModLoaderType } from "./Resolver";

export interface ModMeta {
  provider: "Modrinth" | "Curseforge" | "CursePlusPlus";
  // ...CPP stands for a browser-based Curseforge API
  id: string;
  slug: string;
  displayName: string;
  thumbNail: string;
  supportVersions: string[];
}

export interface ModArtifact {
  modLoader: ModLoaderType;
  id: string;
  gameVersion: string[];
  downloadUrl: string;
  hash?: string;
  size?: number;
  fileName: string;
}
