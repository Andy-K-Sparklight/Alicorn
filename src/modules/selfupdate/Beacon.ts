import fs from "fs-extra";
import os from "os";
import path from "path";
import { getMainExecutable } from "../config/PathSolve";
// Place a symlink at ~/alicorn, so that our bootstrap in packs can find it
export async function setBeacon(): Promise<void> {
  const target = path.join(os.homedir(), "alicorn-launcher");
  await fs.remove(target);
  await fs.symlink(getMainExecutable(), target);
}
