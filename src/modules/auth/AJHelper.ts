import { getActualDataPath, saveDefaultData } from "../config/DataSupport";
import { toBase64 } from "js-base64";
import got from "got";

export const AJ_FILE_BASE = "authlib-injector.jar";

// Download the latest Authlib Injector
export async function prepareAJ(): Promise<void> {
  await saveDefaultData(AJ_FILE_BASE);
}

export function whereAJ(): string {
  return getActualDataPath(AJ_FILE_BASE);
}

export async function prefetchData(authServer: string): Promise<string> {
  try {
    return toBase64(
      (await got.get(authServer, { cache: false, responseType: "text" })).body
    );
  } catch {
    return "";
  }
}
