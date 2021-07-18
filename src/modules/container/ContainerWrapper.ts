import fs from "fs-extra";
import path from "path";
import {
  getContainer,
  registerContainer,
  unregisterContainer,
} from "./ContainerUtil";
import { MinecraftContainer } from "./MinecraftContainer";
import { markASC } from "./SharedFiles";

// Create a container at specified dir
export async function createNewContainer(
  rootDir: string,
  name: string,
  isASC = false
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
    try {
      await markASC(d);
    } catch {}
    registerContainer(new MinecraftContainer(d, name));
  }
}

// Unlink a container, don't delete
export function unlinkContainer(name: string): void {
  unregisterContainer(name);
}

// Remove files, don't unlink
export async function clearContainer(name: string): Promise<void> {
  const dir = getContainer(name).resolvePath();
  if (dir === path.resolve()) {
    throw new Error("Invalid target! Cannot operate cwd.");
  }
  try {
    await fs.emptydir(dir);
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
