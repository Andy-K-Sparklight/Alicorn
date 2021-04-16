import path from "path";
import fs from "fs-extra";
import { MinecraftContainer } from "./MinecraftContainer";
import {
  getContainer,
  registerContainer,
  unregisterContainer,
} from "./ContainerUtil";

// Create a container at specified dir
export async function createNewContainer(
  rootDir: string,
  name: string
): Promise<void> {
  if (path.resolve(rootDir) === path.resolve()) {
    throw new Error("Invalid target! Cannot operate cwd.");
  }
  let stat;
  const d = path.resolve(rootDir);
  try {
    try {
      stat = await fs.stat(d);
    } catch {
      await fs.ensureDir(d);
      registerContainer(new MinecraftContainer(d, name));
      return;
    }
  } catch (e) {
    throw new Error("Cannot create container. Caused by: " + e);
  }
  if (!stat?.isDirectory()) {
    throw new Error("Invalid target! Target is not a directory.");
  } else {
    registerContainer(new MinecraftContainer(d, name));
  }
}

// Unlink a container, don't delete
export function unlinkContainer(name: string): void {
  unregisterContainer(name);
}

// Remove files, then unlink
export async function deleteContainer(name: string): Promise<void> {
  unlinkContainer(name);
  const dir = getContainer(name).resolvePath();
  if (dir === path.resolve()) {
    throw new Error("Invalid target! Cannot operate cwd.");
  }
  try {
    await fs.remove(dir);
  } catch (e) {
    throw new Error("Cannot delete container. Caused by: " + e);
  }
}

// Fork a container, this will delete everything in the target directory!
export async function forkContainer(
  c1: MinecraftContainer,
  c2: MinecraftContainer
): Promise<void> {
  try {
    unlinkContainer(c2.id);
    await fs.emptyDir(c2.resolvePath());
    registerContainer(c2);
    await fs.copy(c1.resolvePath(), c2.resolvePath());
  } catch (e) {
    throw new Error("Cannot fork container. Caused by: " + e);
  }
}
