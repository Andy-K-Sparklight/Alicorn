import { app } from "electron";
import fs from "fs-extra";
import os from "os";
import path from "path";
// Place a symlink at ~/alicorn, so that our bootstrap in packs can find it
export async function setBeacon(): Promise<void> {
  try {
    const target = path.join(os.homedir(), "alicorn-is-here");
    await fs.outputFile(target, app.getPath("exe"));
    console.log("Beacon set!");
  } catch (e) {
    console.log(e);
  }
}
