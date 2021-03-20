import { AbstractContainer } from "./AbstractContainer";
import path from "path";

export class SimpleContainer extends AbstractContainer {
  resolvePath(relativePath: string): string {
    return path.join(this.rootDir, relativePath);
  }

  constructor(rootDir: string, id: string) {
    super(rootDir, id);
  }
}
