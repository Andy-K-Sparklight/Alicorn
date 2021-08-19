import got from "got";
import { toBase64 } from "js-base64";
import { getActualDataPath, saveDefaultData } from "../config/DataSupport";
import { getProxyAgent } from "../download/ProxyConfigure";

export const AJ_FILE_BASE = "authlib-injector.ald";

export async function prepareAJ(): Promise<void> {
  await saveDefaultData(AJ_FILE_BASE);
}

export function whereAJ(): string {
  return getActualDataPath(AJ_FILE_BASE);
}

export async function prefetchData(authServer: string): Promise<string> {
  try {
    return toBase64(
      (
        await got.get(authServer, {
          https: {
            rejectUnauthorized: false,
          },
          agent: getProxyAgent(),
          responseType: "text",
        })
      ).body
    );
  } catch {
    return "";
  }
}
