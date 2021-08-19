import { invokeWorker } from "../../renderer/Schedule";
import { getBoolean } from "../config/ConfigSupport";
export async function validate(
  file: string,
  expected: string
): Promise<boolean> {
  if (getBoolean("download.skip-validate")) {
    return Promise.resolve(true);
  }
  const actual = await getHash(file);
  if (actual.trim().toLowerCase() === expected.trim().toLowerCase()) {
    return true;
  }
  return false;
}

export async function getHash(f: string): Promise<string> {
  return String(await invokeWorker("Sha1File", f));
}

export async function getIdentifier(f: string): Promise<string> {
  try {
    const r1 = await getHash(f);
    const r2 = String(await invokeWorker("Sha256File", f));
    return r1 + "-" + r2;
  } catch (e) {
    console.log(e);
    return "";
  }
}
