import { AbstractContainer } from "./AbstractContainer";
import path from "path";

// TODO

export class MinecraftContainer extends AbstractContainer {
  resolvePath(relativePath: string): string {
    return path.resolve(path.join(this.rootDir, relativePath));
  }
}
