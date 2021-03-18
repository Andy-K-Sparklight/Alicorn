import path from "path";

// TODO

const GlobalContainerDescriptorTable: Map<string, string> = new Map();

export abstract class AbstractContainer {
  protected rootDir: string;
  protected id: string;

  protected constructor(id: string, rootDir: string) {
    this.id = id;
    this.rootDir = rootDir;
  }

  abstract resolvePath(relativePath: string): string;
}

export function rootOf(containerID: string): string {
  return GlobalContainerDescriptorTable.get(containerID) || path.resolve();
}

enum GameFileType {
  ASSET,
  ASSET_INDEX,
  PROFILE,
  MOD,
  SHADER_PACK,
  RESOURCE_PACK,
  LIBRARY,
  CORE,
}

export { GameFileType };
