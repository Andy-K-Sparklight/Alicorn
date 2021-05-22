import { MinecraftContainer } from "../container/MinecraftContainer";
import fs from "fs-extra";

export async function scanReports(c: MinecraftContainer): Promise<string[]> {
  try {
    return await fs.readdir(c.getCrashReportsRoot());
  } catch {
    return [];
  }
}
