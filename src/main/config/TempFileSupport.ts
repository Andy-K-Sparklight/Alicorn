import path from "path";
import os from "os";
import hash from "object-hash";
import fs from "fs-extra";

const ALICORN_TMP_ROOT = path.join(os.tmpdir(), "alicorn");

const TMP_DESCRIPTOR_TABLE: Map<string, string> = new Map();

export async function getTempFilePath(fileName: string): Promise<string> {
  if (TMP_DESCRIPTOR_TABLE.has(fileName)) {
    return TMP_DESCRIPTOR_TABLE.get(fileName) || "";
  }
  const extName = path.extname(fileName);
  const fNameHash = hash(fileName);
  const fTarget = path.join(ALICORN_TMP_ROOT, fNameHash + extName);
  TMP_DESCRIPTOR_TABLE.set(fileName, fTarget);
  await fs.ensureDir(ALICORN_TMP_ROOT);
  return fTarget;
}

export function removeTempFilePath(fileName: string): void {
  TMP_DESCRIPTOR_TABLE.delete(fileName);
}
